def get_email_template(title, content):
    return f"""
    <html>
    <head>
        <style>
            body {{ font-family: sans-serif; background-color: #f4f4f4; padding: 20px; }}
            .container {{ max-width: 600px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            .header {{ background: #2c3e50; color: #fff; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; color: #333; line-height: 1.6; }}
            .footer {{ background: #eee; padding: 10px; text-align: center; font-size: 12px; color: #777; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f2f2f2; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>{title}</h2>
            </div>
            <div class="content">
                {content}
                <p style="margin-top: 30px;">Regards,<br>PulseCare Support Team</p>
            </div>
            <div class="footer">
                <p>&copy; PulseCare</p>
            </div>
        </div>
    </body>
    </html>
    """
