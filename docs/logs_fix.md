# Bugs & Fixes I Did During Development

Just keeping track of all the issues I ran into while building this project and how I fixed them. Hopefully this helps if I (or someone else) runs into similar problems later.

---

## Bug #1: Vue Template Showing Before Loading
**When:** October 10, 2024

**What happened:** When I refreshed the page, I could see `{{ error }}` and `{{ success }}` text for a split second before it disappeared. Looked really ugly.

**Why it happened:** I moved the CSS that hides Vue templates to the bottom of the HTML file to make the page load faster, but that meant the CSS loaded too late.

**How I fixed it:**
- Moved the important CSS (`[v-cloak] { display: none !important; }`) back to the `<head>` tag
- Left other CSS at the bottom
- Now templates are hidden immediately

**Changed:** `frontend/index.html`

**What I learned:** Some CSS is too important to delay loading. If it prevents visual bugs, put it in the head tag.

---

## Bug #2: Doctor Details Missing in Department List
**When:** October 15, 2024

**What happened:** When patients clicked on departments, they could only see doctor names. No qualification or experience was showing up.

**Why it happened:** I forgot to include those fields in the backend API response. Backend was only sending `id`, `name`, and `department`.

**How I fixed it:**
- Updated `/api/patient/departments` route to include `qualification` and `experience`
- Now frontend shows: "Dr. Sharma, MBBS MD, 10 years"

**Changed:** `backend/routes/patient.py`

**What I learned:** Always double-check what data the frontend needs and make sure the backend sends it all.

---

## Bug #3: Could Book Appointments for Yesterday lol
**When:** October 20, 2024

**What happened:** Accidentally discovered I could book an appointment for yesterday's date. Obviously that makes no sense in real life.

**Why it happened:** 
- No validation in backend to check dates
- Frontend date picker didn't have minimum date set
- Nobody was checking if the date made sense

**How I fixed it:** Added validation in 3 places (overkill but better safe than sorry)

1. **Backend** - Check if date is in the past, return error
2. **Frontend HTML** - Set `min` attribute on date input to today
3. **Frontend JS** - Check date before even sending to backend

Code I added:
```python
# In backend
today = datetime.now().date()
if apt_date < today:
    return error message
```

**Changed:** 
- `backend/routes/patient.py`
- `frontend/js/app.js`
- `frontend/js/patient.js`
- `frontend/index.html`

**What I learned:** Always validate both on frontend (for good UX) and backend (for security). Never trust user input.

---

## Bug #4: Emails Not Sending
**When:** October 25, 2024

**What happened:** Appointments were getting booked but no confirmation emails were being sent. Patients had no way to know.

**Why it happened:**
- Forgot to start the Celery worker process
- Redis wasn't running either
- No error messages anywhere telling me this

**How I fixed it:**
- Split Celery code into separate files (`email.py`, `reminders.py`, `reports.py`)
- Made sure Redis is running: `sudo service redis-server start`
- Started Celery worker: `celery -A celery_tasks worker --loglevel=info`
- Added better error logging

**Changed:**
- Created `backend/celery_tasks/` folder with separate files
- Updated `backend/celery_tasks/__init__.py`

**What I learned:** Background tasks are easy to forget about. Always check if Redis and Celery are actually running. Also, add logs everywhere!

---

## Bug #5: Icons Not Showing in Admin Panel
**When:** October 28, 2024

**What happened:** Some buttons in admin dashboard showed empty squares instead of icons. Looked really bad.

**Why it happened:** I used icon names that don't actually exist in Bootstrap Icons:
- `bi-person-plus-fill` ❌
- `bi-pencil-square` ❌  
- `bi-person-fill-gear` ❌

**How I fixed it:** Checked Bootstrap Icons documentation and used the correct names:
- `bi-person-plus` ✅
- `bi-pencil` ✅
- `bi-person-gear` ✅

**Changed:** `frontend/js/admin.js`

**What I learned:** Don't assume icon names, always check the docs. Small mistakes like this are embarrassing.

---

## Bug #6: Every Page Looked Different
**When:** November 1, 2024

**What happened:** Admin page had one style, doctor page had another, patient page looked completely different. No consistency at all.

**Why it happened:** I was just adding features without thinking about design consistency. Each page was designed at different times.

**How I fixed it:**
- Picked one color scheme (dark slate #0f172a) and used it everywhere
- Made all card headers look the same (with icons and badges)
- Standardized button styles (rounded pills for navigation)
- Used same modal design across all pages
- Added consistent icons and spacing

**Changed:**
- `frontend/custom.css` - Added color variables
- `frontend/js/admin.js` - Updated card headers
- `frontend/js/doctor.js` - Same styling
- `frontend/js/patient.js` - Made consistent
- `frontend/index.html` - New navbar and hero section

**What I learned:** Design consistency matters A LOT. Should have planned the design system from the start instead of fixing it later.

---

## Bug #7: Empty Database After Setup
**When:** November 5, 2024

**What happened:** After running `init_db.py`, database was created but completely empty. Had to manually create admin, doctors, patients to test anything. Super annoying.

**Why it happened:** The init script only created tables, didn't add any data.

**How I fixed it:**
- Renamed file to `seed_db.py` (makes more sense)
- Added code to create sample data:
  - 1 admin (admin/admin123)
  - 5 doctors (dr_sharma, dr_verma, dr_patel, dr_singh, dr_kumar)
  - 10 patients (patient1, patient2, etc.)
  - Some appointments
  - Doctor schedules

Now anyone can just run `python seed_db.py` and have a working app with data to test.

**Changed:** Renamed and updated `backend/seed_db.py`

**What I learned:** Always provide sample data. Makes development and testing so much easier. Future me will thank present me.

---

## Bug #8: Ugly Confirm Dialogs for Cancellation
**When:** November 8, 2024

**What happened:** When cancelling appointments, I was using the browser's default `confirm()` dialog. Looked really unprofessional and didn't show any details about the appointment.

**Why it happened:** I was lazy and used `confirm()` because it's quick to implement.

**How I fixed it:**
- Replaced all `confirm()` with proper Bootstrap modals
- Modal shows appointment details (patient name, date, time)
- Better styled buttons
- Added loading spinner while cancelling

**Changed:**
- `frontend/js/admin.js` - Added cancel modal
- `frontend/js/doctor.js` - Added cancel modal

**What I learned:** Browser dialogs look bad in 2026. Always use custom modals. Takes a bit more time but looks way more professional.

---

## Summary Stats

- Total bugs fixed: **8**
- Days spent debugging: too many to count
- Times I wanted to quit: several
- Cups of coffee consumed: too many

**Categories:**
- UI bugs: 4
- Backend bugs: 2
- Setup issues: 2

**Biggest lessons:**
1. Always validate user input (frontend AND backend)
2. Check the docs before using libraries
3. Design consistency is not optional
4. Background tasks need proper setup
5. Sample data saves SO much time
6. Browser dialogs are ugly, use modals

---

*Will keep updating this as I find more bugs (because let's be honest, there are definitely more)*
