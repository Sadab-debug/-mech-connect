import sqlite3
conn = sqlite3.connect('mistrivai_1769168048.db')
cur = conn.cursor()
# Fetch mechanic 11 session info
cur.execute('SELECT id, username, email FROM mechanics WHERE email = ?', ('jarif123@gmail.com',))
mech = cur.fetchone()
print('Mechanic record:', mech)
if mech:
    cur.execute('SELECT id, user_id, mechanic_id, address, preferred_time, problem_description, offer, status FROM bookings WHERE mechanic_id = ?', (mech[0],))
    bookings = cur.fetchall()
    print('Bookings for this mechanic:')
    for b in bookings:
        print(b)
else:
    print('Mechanic not found')
conn.close()
