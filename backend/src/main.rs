use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};
use std::{sync::Arc, time::Duration};
use tower_http::cors::{AllowHeaders, AllowMethods, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod application;
mod domain;
mod infrastructure;
mod presentation;
mod shared;

use application::services::{ActivityAppService, AuthAppService, NotificationAppService, ProjectAppService, TaskAppService, TeamAppService};
use infrastructure::{
    config::AppConfig,
    database,
    persistence::{PgActivityLogRepository, PgNotificationRepository, PgProjectRepository, PgTaskRepository, PgTeamRepository, PgUserRepository},
};
use presentation::handlers::{activity_handler, auth_handler, notification_handler, project_handler, task_handler, team_handler};
use presentation::middleware::auth_middleware;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Load configuration
    let config = AppConfig::from_env();

    // Database connection
    let pool = database::create_pool(&config.database_url)
        .await
        .expect("Failed to create database pool");

    // Create repositories
    let user_repository = Arc::new(PgUserRepository::new(pool.clone()));
    let project_repository = Arc::new(PgProjectRepository::new(pool.clone()));
    let task_repository = Arc::new(PgTaskRepository::new(pool.clone()));
    let team_repository = Arc::new(PgTeamRepository::new(pool.clone()));
    let activity_repository = Arc::new(PgActivityLogRepository::new(pool.clone()));
    let notification_repository = Arc::new(PgNotificationRepository::new(pool.clone()));

    // Create application services
    let auth_service = Arc::new(AuthAppService::new(
        user_repository,
        config.jwt_secret.clone(),
        config.jwt_expiration,
    ));
    let project_service = Arc::new(ProjectAppService::new(project_repository));
    let task_service = Arc::new(TaskAppService::new(task_repository));
    let team_service = Arc::new(TeamAppService::new(team_repository));
    let activity_service = Arc::new(ActivityAppService::new(activity_repository));
    let notification_service = Arc::new(NotificationAppService::new(notification_repository));

    // CORS configuration - restrict to allowed origins
    let cors = CorsLayer::new()
        .allow_origin(config.allowed_origins())
        .allow_methods(AllowMethods::list([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::PUT,
            axum::http::Method::DELETE,
            axum::http::Method::OPTIONS,
        ]))
        .allow_headers(AllowHeaders::list([
            axum::http::header::CONTENT_TYPE,
            axum::http::header::AUTHORIZATION,
            axum::http::header::ACCEPT,
        ]))
        .allow_credentials(true)
        .max_age(Duration::from_secs(3600));

    // Build router
    let app = Router::new()
        .route("/", get(health_check))
        .route("/health", get(health_check))
        .nest(
            "/api/v1",
            api_routes(auth_service, project_service, task_service, team_service, activity_service, notification_service),
        )
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    // Start server
    let listener = tokio::net::TcpListener::bind(&config.server_addr)
        .await
        .unwrap();

    tracing::info!("Server running on http://{}", config.server_addr);
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "PMO Backend is running!"
}

fn api_routes(
    auth_service: Arc<AuthAppService>,
    project_service: Arc<ProjectAppService>,
    task_service: Arc<TaskAppService>,
    team_service: Arc<TeamAppService>,
    activity_service: Arc<ActivityAppService>,
    notification_service: Arc<NotificationAppService>,
) -> Router {
    // Public auth routes (no authentication required)
    let public_auth_routes = Router::new()
        .route("/auth/register", post(auth_handler::register))
        .route("/auth/login", post(auth_handler::login))
        .with_state(auth_service);

    // Protected project routes
    let project_routes = Router::new()
        .route("/projects", get(project_handler::list_projects))
        .route("/projects", post(project_handler::create_project))
        .route("/projects/{id}", get(project_handler::get_project))
        .route("/projects/{id}", put(project_handler::update_project))
        .route("/projects/{id}", delete(project_handler::delete_project))
        .route(
            "/projects/{id}/tasks",
            get(project_handler::get_project_tasks),
        )
        .route(
            "/projects/{id}/milestones",
            get(project_handler::get_project_milestones),
        )
        .layer(middleware::from_fn(auth_middleware))
        .with_state(project_service);

    // Protected task routes
    let task_routes = Router::new()
        .route("/tasks", get(task_handler::list_tasks))
        .route("/tasks", post(task_handler::create_task))
        .route("/tasks/{id}", get(task_handler::get_task))
        .route("/tasks/{id}", put(task_handler::update_task))
        .route("/tasks/{id}", delete(task_handler::delete_task))
        .layer(middleware::from_fn(auth_middleware))
        .with_state(task_service);

    // Protected team routes
    let team_routes = Router::new()
        .route("/teams", get(team_handler::list_teams))
        .route("/teams", post(team_handler::create_team))
        .route("/teams/{id}", get(team_handler::get_team))
        .route("/teams/{id}", put(team_handler::update_team))
        .route("/teams/{id}", delete(team_handler::delete_team))
        .route("/teams/{id}/members", get(team_handler::get_team_members))
        .route("/teams/{id}/members", post(team_handler::add_team_member))
        .layer(middleware::from_fn(auth_middleware))
        .with_state(team_service);

    // Protected activity routes
    let activity_routes = Router::new()
        .route("/activities", get(activity_handler::list_activities))
        .layer(middleware::from_fn(auth_middleware))
        .with_state(activity_service);

    // Protected notification routes
    let notification_routes = Router::new()
        .route("/notifications", get(notification_handler::list_notifications))
        .route("/notifications/unread", get(notification_handler::get_unread_notifications))
        .route("/notifications/unread/count", get(notification_handler::get_unread_count))
        .route("/notifications/read-all", post(notification_handler::mark_all_as_read))
        .route("/notifications/{id}/read", post(notification_handler::mark_as_read))
        .route("/notifications/{id}", delete(notification_handler::delete_notification))
        .layer(middleware::from_fn(auth_middleware))
        .with_state(notification_service);

    Router::new()
        .merge(public_auth_routes)
        .merge(project_routes)
        .merge(task_routes)
        .merge(team_routes)
        .merge(activity_routes)
        .merge(notification_routes)
}
