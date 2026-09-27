import re

with open('/Users/drikshathakur/Desktop/Reservia/views/includes/footer.ejs', 'r') as f:
    content = f.read()

old_logo = r'<span style="font-family: \'Forum\', cursive; font-size: 2.2rem; color: #B8860B; text-transform: uppercase; letter-spacing: 0.15em; line-height: 1;">RESERVIA</span>'
new_logo = """<div class="creative-logo" style="margin-bottom: 20px;">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.5 8.5L22 12L15.5 15.5L12 22L8.5 15.5L2 12L8.5 8.5L12 2Z" fill="hsl(42, 48%, 77%)" />
    </svg>
    <div class="logo-text" style="text-align: left;">
        <span class="logo-title" style="display:block; font-family: 'Forum', cursive; font-size: 1.8rem; color: #fff; letter-spacing: 0.15em; line-height: 1; margin-bottom: 4px;">RESERVIA</span>
        <span class="logo-sub" style="display:block; font-family: 'DM Sans', sans-serif; font-size: 0.65rem; color: hsl(42, 48%, 77%); letter-spacing: 0.4em; text-transform: uppercase; line-height: 1;">FINE DINING</span>
    </div>
</div>"""

content = content.replace(old_logo, new_logo)

with open('/Users/drikshathakur/Desktop/Reservia/views/includes/footer.ejs', 'w') as f:
    f.write(content)
