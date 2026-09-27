with open('/Users/drikshathakur/Desktop/Reservia/models/reservation.js', 'r') as f:
    content = f.read()

content = content.replace(
    'requests: String,',
    "requests: String,\n    status: { type: String, default: 'Reserved' }, // 'Reserved', 'Completed', 'Cancelled'"
)

with open('/Users/drikshathakur/Desktop/Reservia/models/reservation.js', 'w') as f:
    f.write(content)
print("Reservation model updated")
