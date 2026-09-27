from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.database import init_db
from app.services.background_scheduler import start_scheduler
from app.routes.product_routes import product_bp
from app.routes.chat_routes import chat_bp
from app.routes.auth_routes import auth_bp
from app.routes.alert_routes import alert_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend Vite dev server (http://localhost:5173 or any local origin)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize Database Schema & Seed Data
    init_db()

    # Start Background Price History & Refresh Scheduler
    start_scheduler()

    # Register Blueprints
    app.register_blueprint(product_bp, url_prefix='/api/products')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(alert_bp, url_prefix='/api/alerts')

    @app.route('/')
    def index():
        return {
            "status": "online",
            "name": "Multi-Platform Shopping Comparison Agent API",
            "version": "1.0.0",
            "endpoints": [
                "/api/products/search",
                "/api/products/compare/<id>",
                "/api/products/featured",
                "/api/chat/message",
                "/api/chat/stream",
                "/api/auth/google",
                "/api/auth/otp/send",
                "/api/auth/otp/verify",
                "/api/alerts/watchlist"
            ]
        }

    return app
