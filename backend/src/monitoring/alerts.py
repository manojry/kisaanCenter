
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from typing import List, Dict, Any
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class AlertManager:
    def __init__(self, smtp_config: Dict[str, Any]):
        self.smtp_config = smtp_config
        self.alert_thresholds = {
            "cpu_percent": 80,
            "memory_percent": 85,
            "disk_percent": 90,
            "response_time_ms": 2000,
            "error_rate_percent": 5,
            "failed_transactions_per_hour": 10
        }
    
    def check_system_alerts(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check system metrics against thresholds"""
        alerts = []
        
        # CPU usage alert
        if metrics["system"]["cpu_percent"] > self.alert_thresholds["cpu_percent"]:
            alerts.append({
                "type": "system",
                "severity": "warning",
                "metric": "cpu_usage",
                "value": metrics["system"]["cpu_percent"],
                "threshold": self.alert_thresholds["cpu_percent"],
                "message": f"High CPU usage: {metrics['system']['cpu_percent']}%"
            })
        
        # Memory usage alert
        if metrics["system"]["memory"]["percent"] > self.alert_thresholds["memory_percent"]:
            alerts.append({
                "type": "system",
                "severity": "warning",
                "metric": "memory_usage",
                "value": metrics["system"]["memory"]["percent"],
                "threshold": self.alert_thresholds["memory_percent"],
                "message": f"High memory usage: {metrics['system']['memory']['percent']}%"
            })
        
        # Disk usage alert
        if metrics["system"]["disk"]["percent"] > self.alert_thresholds["disk_percent"]:
            alerts.append({
                "type": "system",
                "severity": "critical",
                "metric": "disk_usage",
                "value": metrics["system"]["disk"]["percent"],
                "threshold": self.alert_thresholds["disk_percent"],
                "message": f"High disk usage: {metrics['system']['disk']['percent']}%"
            })
        
        return alerts
    
    def check_business_alerts(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check business metrics for anomalies"""
        alerts = []
        
        # Check for unusual transaction patterns
        if "database" in metrics and "transaction_status_breakdown" in metrics["database"]:
            failed_transactions = metrics["database"]["transaction_status_breakdown"].get("FAILED", 0)
            total_transactions = sum(metrics["database"]["transaction_status_breakdown"].values())
            
            if total_transactions > 0:
                failure_rate = (failed_transactions / total_transactions) * 100
                if failure_rate > self.alert_thresholds["error_rate_percent"]:
                    alerts.append({
                        "type": "business",
                        "severity": "warning",
                        "metric": "transaction_failure_rate",
                        "value": failure_rate,
                        "threshold": self.alert_thresholds["error_rate_percent"],
                        "message": f"High transaction failure rate: {failure_rate:.2f}%"
                    })
        
        return alerts
    
    def send_alert_email(self, alerts: List[Dict[str, Any]], recipients: List[str]):
        """Send alert notifications via email"""
        if not alerts:
            return
        
        try:
            # Create email message
            msg = MimeMultipart()
            msg['From'] = self.smtp_config['from_email']
            msg['To'] = ', '.join(recipients)
            msg['Subject'] = f"KisaanCenter Alert - {len(alerts)} Alert(s) Detected"
            
            # Create email body
            body = self._create_alert_email_body(alerts)
            msg.attach(MimeText(body, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_config['host'], self.smtp_config['port']) as server:
                if self.smtp_config.get('use_tls'):
                    server.starttls()
                if self.smtp_config.get('username'):
                    server.login(self.smtp_config['username'], self.smtp_config['password'])
                
                server.send_message(msg)
            
            logger.info(f"Alert email sent to {recipients}")
            
        except Exception as e:
            logger.error(f"Failed to send alert email: {str(e)}")
    
    def _create_alert_email_body(self, alerts: List[Dict[str, Any]]) -> str:
        """Create HTML email body for alerts"""
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .alert {{ margin: 10px 0; padding: 10px; border-radius: 5px; }}
                .warning {{ background-color: #fff3cd; border: 1px solid #ffeaa7; }}
                .critical {{ background-color: #f8d7da; border: 1px solid #f5c6cb; }}
                .info {{ background-color: #d1ecf1; border: 1px solid #bee5eb; }}
            </style>
        </head>
        <body>
            <h2>KisaanCenter System Alerts</h2>
            <p>Generated at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
            
            <h3>Alert Summary</h3>
            <ul>
                <li>Total Alerts: {len(alerts)}</li>
                <li>Critical: {len([a for a in alerts if a['severity'] == 'critical'])}</li>
                <li>Warning: {len([a for a in alerts if a['severity'] == 'warning'])}</li>
            </ul>
            
            <h3>Alert Details</h3>
        """
        
        for alert in alerts:
            severity_class = alert['severity']
            html += f"""
            <div class="alert {severity_class}">
                <strong>{alert['severity'].upper()}</strong> - {alert['type'].title()} Alert<br>
                <strong>Metric:</strong> {alert['metric']}<br>
                <strong>Current Value:</strong> {alert['value']}<br>
                <strong>Threshold:</strong> {alert['threshold']}<br>
                <strong>Message:</strong> {alert['message']}
            </div>
            """
        
        html += """
        </body>
        </html>
        """
        
        return html

# Global alert manager instance
alert_manager = None

def initialize_alert_manager(smtp_config: Dict[str, Any]):
    global alert_manager
    alert_manager = AlertManager(smtp_config)
