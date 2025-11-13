import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_mapping(
        SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL', 'sqlite:///dev.sqlite3'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    db.init_app(app)
    migrate.init_app(app, db)

    from .routes.policies import bp as policies_bp
    from .routes.claims import bp as claims_bp
    from .routes.customers import bp as customers_bp
    from .routes.underwriting import bp as underwriting_bp
    from .routes.reports import bp as reports_bp

    app.register_blueprint(policies_bp, url_prefix='/api/policies')
    app.register_blueprint(claims_bp, url_prefix='/api/claims')
    app.register_blueprint(customers_bp, url_prefix='/api/customers')
    app.register_blueprint(underwriting_bp, url_prefix='/api/underwriting')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')

    @app.get('/health')
    def health():
        return jsonify(status='ok')

    return app


