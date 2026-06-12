You are a senior full-stack engineer and system architect.

Your task is to generate the FULL BASE PROJECT for a wedding mobile/web application.

The output must include:

• Full project architecture
• Backend project structure
• Frontend project structure
• Database schema
• API endpoints
• Angular services
• Ionic pages
• Authentication system
• Admin panel
• DJ panel
• Photographer panel
• Image upload system
• Image cropping system for the gallery
• Instructions to run the project locally

The goal is to create a **Wedding Event Companion App**.

Guests receive a digital invitation with a code that allows them to access the wedding app.

The system includes:

• Guest mobile app
• Admin dashboard
• DJ dashboard
• Photographer dashboard

---

TECH STACK

Frontend:

* Angular 20.14
* Ionic (latest)
* Angular standalone components
* Angular Signals where appropriate

Backend:

* Node.js 20.14
* Express
* JWT authentication
* REST API

Database:

* PostgreSQL

Image storage:

* local storage for development
* architecture ready for AWS S3

Image processing:

* Sharp library
* automatic resizing
* automatic center cropping

---

PROJECT STRUCTURE

Create a monorepo structure like:

/wedding-app
/backend
/frontend
/docs

Backend:
Node + Express + TypeScript

Frontend:
Angular + Ionic

---

USER ROLES

Define permissions and flows for:

1. Super Admin
2. Wedding Admin (couple)
3. Guest
4. DJ
5. Photographer

---

AUTHENTICATION

Guests login using:

Invitation Code

Admins login using:

Email + password

Use JWT tokens.

---

MAIN SYSTEM FLOW

Admin creates a wedding event.

Admin configures:

* Bride name
* Groom name
* Date
* Time
* Location
* Description
* Images
* Event schedule

Admin generates invitation codes.

Guests receive invitation with:

* App download link
* Invitation code

Guest enters code → account created.

---

FEATURES

GUEST APP

1 RSVP confirmation

Guest confirms attendance.

Fields:

* attending yes/no
* number of guests
* dietary restrictions
* comments

2 Wedding presentation

Page with:

* couple story
* wedding instructions
* event timeline
* images

3 Photo gallery

Photographer uploads photos during the event.

Guests can:

* view photos
* tag other guests
* like photos
* share photos to Instagram

IMPORTANT:

Photos displayed in the app must have a **consistent framing system**.

Implement:

* automatic center crop
* multiple sizes
* square preview format

Use Sharp for processing.

4 DJ requests

Guests can:

* request songs
* upvote songs
* comment

DJ can see:

* trending songs
* request list

5 Guestbook

Guests leave messages to the couple.

Fields:

* message
* name
* emoji reactions

---

ADMIN PANEL

Admin must be able to:

Wedding configuration

* edit names
* edit date/time
* edit location
* upload images
* edit event timeline

Guest management

* generate invitation codes
* group guests by family
* see RSVP confirmations

Content management

* edit instructions
* edit couple story

Photo moderation

* approve photos
* delete photos
* highlight photos

Analytics

* confirmed guests
* total guests
* song requests

---

DJ PANEL

DJ interface must allow:

* see song requests
* sort by votes
* mark songs as played

---

PHOTOGRAPHER PANEL

Photographer must be able to:

* upload photos quickly
* batch upload
* auto compression
* auto crop

---

DATABASE DESIGN

Create PostgreSQL tables for:

users
roles
wedding
guests
invitation_codes
rsvp
photos
photo_tags
song_requests
song_votes
guestbook_messages

Include key fields.

---

API DESIGN

Generate REST endpoints such as:

POST /auth/login
POST /auth/invitation
POST /rsvp
GET /photos
POST /photos/upload
POST /song-request
GET /song-request
POST /guestbook

---

FRONTEND STRUCTURE

Angular + Ionic pages:

Home
Event Info
RSVP
Gallery
DJ Requests
Guestbook
Profile

Admin pages:

Dashboard
Wedding settings
Guest management
Photo moderation
Analytics

DJ pages:

Song request dashboard

Photographer pages:

Photo uploader

---

EXTRA UX FEATURES

Add ideas like:

* wedding countdown
* live gallery feed
* trending songs
* animated RSVP confirmation

---

OUTPUT FORMAT

Provide:

1 Project architecture
2 Folder structure
3 Backend code examples
4 Database schema
5 API endpoints
6 Angular service examples
7 Ionic page examples
8 Instructions to run locally

Generate realistic starter code where possible.
