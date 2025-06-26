from flask import Flask, request, jsonify
import os
import json
import logging
import uuid
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv('../.env.global')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# In-memory storage for demo (replace with database in production)
notifications_db = {}
email_templates = {}

# Notification types
NOTIFICATION_TYPES = {
    'JOB_MATCH': 'job_match',
    'APPLICATION_RECEIVED': 'application_received',
    'APPLICATION_STATUS': 'application_status',
    'NEW_JOB_POSTED': 'new_job_posted',
    'PROFILE_VIEWED': 'profile_viewed',
    'SYSTEM_UPDATE': 'system_update',
    'WELCOME': 'welcome'
}

# Notification priorities
PRIORITIES = {
    'LOW': 'low',
    'MEDIUM': 'medium',
    'HIGH': 'high',
    'URGENT': 'urgent'
}

def send_email(to_email, subject, body, is_html=False):
    """Send email notification"""
    try:
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        email_user = os.getenv('EMAIL_USER')
        email_password = os.getenv('EMAIL_PASSWORD')
        
        if not email_user or not email_password:
            logger.warning("Email credentials not configured")
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = email_user
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add body
        if is_html:
            msg.attach(MIMEText(body, 'html'))
        else:
            msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(email_user, email_password)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {str(e)}")
        return False

def create_notification(user_id, notification_type, title, message, data=None, priority='medium', send_email_flag=False, email=None):
    """Create a new notification"""
    try:
        notification_id = str(uuid.uuid4())
        
        notification = {
            "notificationId": notification_id,
            "userId": user_id,
            "type": notification_type,
            "title": title,
            "message": message,
            "data": data or {},
            "priority": priority,
            "isRead": False,
            "createdAt": datetime.now().isoformat(),
            "readAt": None,
            "emailSent": False
        }
        
        # Store notification
        if user_id not in notifications_db:
            notifications_db[user_id] = []
        
        notifications_db[user_id].append(notification)
        
        # Send email if requested
        if send_email_flag and email:
            email_sent = send_email(email, title, message)
            notification["emailSent"] = email_sent
        
        logger.info(f"Created notification {notification_id} for user {user_id}")
        return notification
        
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    total_notifications = sum(len(notifications) for notifications in notifications_db.values())
    unread_notifications = sum(
        len([n for n in notifications if not n['isRead']]) 
        for notifications in notifications_db.values()
    )
    
    return jsonify({
        "status": "ok",
        "service": "notification-service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "total_notifications": total_notifications,
        "unread_notifications": unread_notifications,
        "email_configured": bool(os.getenv('EMAIL_USER'))
    })

@app.route('/api/notifications/send', methods=['POST'])
def send_notification():
    """
    Send a notification to a user
    
    Expected JSON payload:
    {
        "userId": "string (required)",
        "type": "string (required)",
        "title": "string (required)",
        "message": "string (required)",
        "data": object (optional),
        "priority": "low|medium|high|urgent (optional, default: medium)",
        "sendEmail": boolean (optional, default: false),
        "email": "string (required if sendEmail is true)"
    }
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data:
            return jsonify({
                "error": "Missing JSON payload",
                "code": "MISSING_PAYLOAD"
            }), 400
        
        required_fields = ['userId', 'type', 'title', 'message']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "code": "MISSING_REQUIRED_FIELDS"
            }), 400
        
        user_id = data.get('userId')
        notification_type = data.get('type')
        title = data.get('title')
        message = data.get('message')
        notification_data = data.get('data', {})
        priority = data.get('priority', PRIORITIES['MEDIUM'])
        send_email_flag = data.get('sendEmail', False)
        email = data.get('email')
        
        # Validate notification type
        if notification_type not in NOTIFICATION_TYPES.values():
            return jsonify({
                "error": f"Invalid notification type. Available types: {list(NOTIFICATION_TYPES.values())}",
                "code": "INVALID_NOTIFICATION_TYPE"
            }), 400
        
        # Validate priority
        if priority not in PRIORITIES.values():
            return jsonify({
                "error": f"Invalid priority. Available priorities: {list(PRIORITIES.values())}",
                "code": "INVALID_PRIORITY"
            }), 400
        
        # Validate email if sending email
        if send_email_flag and not email:
            return jsonify({
                "error": "Email is required when sendEmail is true",
                "code": "MISSING_EMAIL"
            }), 400
        
        # Create notification
        notification = create_notification(
            user_id, notification_type, title, message, 
            notification_data, priority, send_email_flag, email
        )
        
        if not notification:
            return jsonify({
                "error": "Failed to create notification",
                "code": "NOTIFICATION_CREATION_FAILED"
            }), 500
        
        return jsonify({
            "notification": notification,
            "message": "Notification sent successfully"
        }), 201
        
    except Exception as e:
        logger.error(f"Error in send_notification endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": "INTERNAL_ERROR"
        }), 500

@app.route('/api/notifications/user/<user_id>', methods=['GET'])
def get_user_notifications(user_id):
    """
    Get notifications for a specific user
    
    Query parameters:
    - limit: number of notifications to return (default: 20)
    - offset: number of notifications to skip (default: 0)
    - unread_only: return only unread notifications (default: false)
    """
    try:
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # Get user notifications
        user_notifications = notifications_db.get(user_id, [])
        
        # Filter unread if requested
        if unread_only:
            user_notifications = [n for n in user_notifications if not n['isRead']]
        
        # Sort by creation date (newest first)
        user_notifications.sort(key=lambda x: x['createdAt'], reverse=True)
        
        # Apply pagination
        total_notifications = len(user_notifications)
        paginated_notifications = user_notifications[offset:offset + limit]
        
        return jsonify({
            "notifications": paginated_notifications,
            "pagination": {
                "total": total_notifications,
                "limit": limit,
                "offset": offset,
                "hasMore": offset + limit < total_notifications
            },
            "summary": {
                "totalNotifications": len(notifications_db.get(user_id, [])),
                "unreadNotifications": len([n for n in notifications_db.get(user_id, []) if not n['isRead']])
            }
        }), 200
        
    except ValueError:
        return jsonify({
            "error": "Invalid limit or offset parameter",
            "code": "INVALID_PARAMETERS"
        }), 400
    except Exception as e:
        logger.error(f"Error in get_user_notifications endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": "INTERNAL_ERROR"
        }), 500

@app.route('/api/notifications/<notification_id>/read', methods=['PUT'])
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        # Find notification
        notification_found = False
        for user_id, notifications in notifications_db.items():
            for notification in notifications:
                if notification['notificationId'] == notification_id:
                    notification['isRead'] = True
                    notification['readAt'] = datetime.now().isoformat()
                    notification_found = True
                    break
            if notification_found:
                break
        
        if not notification_found:
            return jsonify({
                "error": "Notification not found",
                "code": "NOTIFICATION_NOT_FOUND"
            }), 404
        
        return jsonify({
            "message": "Notification marked as read",
            "notificationId": notification_id,
            "readAt": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in mark_notification_read endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "code": "INTERNAL_ERROR"
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Notification Service on port 5006...")
    print("✅ Real-time notifications and email alerts ready!")
    print("📋 Available endpoints:")
    print("   • GET  /health")
    print("   • POST /api/notifications/send")
    print("   • GET  /api/notifications/user/<user_id>")
    print("   • PUT  /api/notifications/<notification_id>/read")
    print("🌐 Service URL: http://localhost:5006")
    print("📧 Features: Push notifications, Email alerts, Real-time updates")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5006, debug=True)
