import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from threading import Thread

FROM = os.getenv('EMAIL_FROM')
TO = os.getenv('EMAIL_TO')
HOST = os.getenv('EMAIL_HOST')
PORT = os.getenv('EMAIL_PORT')
PASSWORD = os.getenv('EMAIL_PASSWORD')


def send_email(body, subject=f'ERROR LOG [{datetime.strftime(datetime.now(), "%b %d, %Y - %I:%M %p")}]'):
    """
    Sends an email with the subject formatted as 'ERROR LOG [Jan 01, 1970 - 12:00 AM]'
    """

    # Send the email on a separate thread so the server doesn't
    # have to wait for it to finish
    thread = Thread(target=_send, args=(body, subject))
    thread.start()


def _send(body, subject):
    msg = MIMEMultipart()
    msg['From'] = FROM
    msg['To'] = TO
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    server = smtplib.SMTP(host=HOST, port=int(PORT))
    server.starttls()
    server.login(FROM, PASSWORD)

    senders = server.sendmail(FROM, TO, msg.as_string())

    server.quit()

    return senders
