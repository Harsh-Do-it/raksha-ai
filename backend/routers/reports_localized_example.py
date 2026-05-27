"""
Example API routes with localization support
Demonstrates how to use LocalizationService in backend routes
"""

from flask import Blueprint, request, jsonify
from services.localization_service import LocalizationService, get_user_language
from datetime import datetime

# Create a blueprint for routes
reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


@reports_bp.route('/submit', methods=['POST'])
def submit_report():
    """
    Submit a new road issue report with localized response
    
    Query params:
    - language: en, hi, ta, te, kn, ml (optional)
    
    Request body:
    {
        "issue_type": "pothole",
        "severity": "high",
        "latitude": 28.7041,
        "longitude": 77.1025,
        "description": "Large pothole on main road"
    }
    """
    language = get_user_language(request)
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['issue_type', 'severity', 'latitude', 'longitude']
        if not all(field in data for field in required_fields):
            return jsonify(
                LocalizationService.get_error_response(
                    'common.validation_error',
                    language,
                    status_code=400
                )
            ), 400
        
        # Process the report (save to database, etc.)
        report_id = f"RPT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Return success response
        response = LocalizationService.get_success_response(
            'reports.report_submitted',
            language,
            {
                'report_id': report_id,
                'status': 'submitted',
                'timestamp': datetime.now().isoformat(),
                'thank_you_message': LocalizationService.get_message(
                    'reports.thank_you',
                    language
                )
            }
        )
        return jsonify(response), 201
        
    except Exception as e:
        print(f"Error submitting report: {str(e)}")
        return jsonify(
            LocalizationService.get_error_response(
                'reports.report_failed',
                language,
                status_code=500
            )
        ), 500


@reports_bp.route('/<report_id>/delete', methods=['DELETE'])
def delete_report(report_id):
    """Delete a report with localized response"""
    language = get_user_language(request)
    
    try:
        # Validate report exists (example)
        if not report_id:
            return jsonify(
                LocalizationService.get_error_response(
                    'common.not_found',
                    language,
                    status_code=404
                )
            ), 404
        
        # Delete report from database
        # ...
        
        return jsonify(
            LocalizationService.get_success_response(
                'reports.report_deleted',
                language,
                {'report_id': report_id}
            )
        ), 200
        
    except Exception as e:
        return jsonify(
            LocalizationService.get_error_response(
                'common.server_error',
                language,
                status_code=500
            )
        ), 500


@reports_bp.route('/nearby', methods=['GET'])
def get_nearby_reports():
    """Get nearby reports with localized response"""
    language = get_user_language(request)
    
    try:
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        radius = request.args.get('radius', 5)
        
        if not lat or not lon:
            return jsonify(
                LocalizationService.get_error_response(
                    'common.validation_error',
                    language,
                    status_code=400
                )
            ), 400
        
        # Query nearby reports from database
        nearby_reports = [
            {
                'id': 'RPT-001',
                'type': 'pothole',
                'severity': 'high',
                'distance': 250,
                'message': LocalizationService.get_message(
                    'notifications.new_report_nearby',
                    language
                )
            },
            {
                'id': 'RPT-002',
                'type': 'flooding',
                'severity': 'medium',
                'distance': 500,
                'message': LocalizationService.get_message(
                    'notifications.road_condition_changed',
                    language
                )
            }
        ]
        
        return jsonify(
            LocalizationService.get_success_response(
                'common.success',
                language,
                {
                    'nearby_reports': nearby_reports,
                    'count': len(nearby_reports),
                    'radius': radius
                }
            )
        ), 200
        
    except Exception as e:
        return jsonify(
            LocalizationService.get_error_response(
                'common.server_error',
                language,
                status_code=500
            )
        ), 500


@reports_bp.route('/notifications', methods=['GET'])
def get_notifications():
    """Get user notifications with localized messages"""
    language = get_user_language(request)
    
    try:
        # Fetch notifications from database
        notifications = [
            {
                'id': 'notif-1',
                'type': 'high_severity_alert',
                'message': LocalizationService.get_message(
                    'notifications.high_severity_alert',
                    language
                ),
                'timestamp': datetime.now().isoformat(),
                'read': False
            },
            {
                'id': 'notif-2',
                'type': 'new_report_nearby',
                'message': LocalizationService.get_message(
                    'notifications.new_report_nearby',
                    language
                ),
                'timestamp': datetime.now().isoformat(),
                'read': True
            }
        ]
        
        return jsonify(
            LocalizationService.get_success_response(
                'common.success',
                language,
                {
                    'notifications': notifications,
                    'unread_count': sum(1 for n in notifications if not n['read'])
                }
            )
        ), 200
        
    except Exception as e:
        return jsonify(
            LocalizationService.get_error_response(
                'common.server_error',
                language,
                status_code=500
            )
        ), 500


@reports_bp.route('/sos/trigger', methods=['POST'])
def trigger_sos():
    """Trigger SOS with localized response"""
    language = get_user_language(request)
    
    try:
        data = request.get_json()
        
        # Validate location
        if 'latitude' not in data or 'longitude' not in data:
            return jsonify(
                LocalizationService.get_error_response(
                    'common.validation_error',
                    language,
                    status_code=400
                )
            ), 400
        
        # Trigger SOS - contact emergency services
        sos_id = f"SOS-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        return jsonify(
            LocalizationService.get_success_response(
                'sos.sos_triggered',
                language,
                {
                    'sos_id': sos_id,
                    'emergency_contacted': True,
                    'message_2': LocalizationService.get_message(
                        'sos.emergency_services_contacted',
                        language
                    ),
                    'message_3': LocalizationService.get_message(
                        'sos.location_shared',
                        language
                    )
                }
            )
        ), 201
        
    except Exception as e:
        return jsonify(
            LocalizationService.get_error_response(
                'common.server_error',
                language,
                status_code=500
            )
        ), 500


# Usage in main Flask app:
# app.register_blueprint(reports_bp)
