import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from threading import Thread
from config import EMAIL_CONFIG


def send_email(body, subject=f'ERROR LOG [{datetime.strftime(datetime.now(), "%b %d, %Y - %I:%M %p")}]'):
    """
    Sends an email with the subject formatted as 'ERROR LOG [Jan 01, 1970 - 12:00 AM]'
    """
    def send():
        from_ = EMAIL_CONFIG['FROM']
        to = EMAIL_CONFIG['TO']

        msg = MIMEMultipart()
        msg['From'] = from_
        msg['To'] = to
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        server = smtplib.SMTP(EMAIL_CONFIG['HOST'], EMAIL_CONFIG['PORT'])
        server.starttls()
        server.login(from_, EMAIL_CONFIG['PASSWORD'])
        server.sendmail(from_, to, msg.as_string())
        server.quit()

    # Send the email on a separate thread so the server doesn't
    # have to wait for it to finish
    thread = Thread(target=send)
    thread.start()
