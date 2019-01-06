import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from config import *


def send_email(body, subject=f'ERROR LOG [{datetime.strftime(datetime.now(), "%b, %d %Y - %I:%M %p")}]'):
    """
    Sends an email with the subject formatted as 'ERROR LOG [Jan, 01 1970 - 12:00 AM]'
    """
    msg = MIMEMultipart()
    msg['From'] = FROM
    msg['To'] = TO
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    server = smtplib.SMTP(HOST, PORT)
    server.starttls()
    server.login(FROM, PASSWORD)
    server.sendmail(FROM, TO, msg.as_string())
    server.quit()
