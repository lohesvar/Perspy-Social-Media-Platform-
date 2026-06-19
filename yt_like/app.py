import os
import sqlite3
from flask import Flask, request, jsonify, render_template, session, redirect
from werkzeug.utils import secure_filename
from db import get_db_connection, init_db, DB_PATH

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = 'perspy_secret_session_key_for_safety'

# Configuration for uploads
UPLOAD_FOLDER = os.path.join(app.static_folder, 'uploads')
ALLOWED_EXTENSIONS = {'mp4', 'webm', 'mov'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload size

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper to run DB queries
def db_query(query, args=(), one=False):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, args)
    rv = cursor.fetchall()
    conn.close()
    return (rv[0] if rv else None) if one else rv

# Route to serve the SPA frontend
@app.route('/')
def index():
    return render_template('index.html')

# Authentication APIs
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    
    if not email or '@' not in email:
        return jsonify({'error': 'Invalid email address.'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    
    if not user:
        # Create user with part of email as username
        username = email.split('@')[0]
        # Append some random digits to make it clean if needed, or keep it simple
        cursor.execute("INSERT INTO users (email, username) VALUES (?, ?)", (email, username))
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
    
    # Store user in session
    session['user_id'] = user['id']
    session['username'] = user['username']
    session['email'] = user['email']
    
    conn.close()
    return jsonify({
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email']
        }
    })

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/me', methods=['GET'])
def get_me():
    if 'user_id' not in session:
        return jsonify({'user': None})
    return jsonify({
        'user': {
            'id': session['user_id'],
            'username': session['username'],
            'email': session['email']
        }
    })

# Channel Personal Studio APIs
@app.route('/api/me/channel', methods=['GET'])
def get_my_channel():
    if 'user_id' not in session:
        return jsonify({'channel': None})
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM channels WHERE user_id = ?", (session['user_id'],))
    channel = cursor.fetchone()
    conn.close()
    
    if not channel:
        return jsonify({'channel': None})
        
    return jsonify({
        'channel': {
            'id': channel['id'],
            'user_id': channel['user_id'],
            'name': channel['name'],
            'description': channel['description'],
            'avatar_path': channel['avatar_path'],
            'banner_path': channel['banner_path'],
            'created_at': channel['created_at']
        }
    })

@app.route('/api/channels', methods=['POST'])
def create_channel():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please login.'}), 401
        
    user_id = session['user_id']
    
    # Check if they already have a channel
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM channels WHERE user_id = ?", (user_id,))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'You already have a channel.'}), 400
        
    # Get parameters
    name = request.form.get('name', '').strip()
    description = request.form.get('description', '').strip()
    
    if not name:
        conn.close()
        return jsonify({'error': 'Channel name is required.'}), 400
        
    avatar_path = None
    banner_path = None
    
    # Handle avatar file upload
    if 'avatar' in request.files:
        file = request.files['avatar']
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            import time
            filename = f"avatar_{int(time.time())}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(save_path)
            avatar_path = f"/static/uploads/{filename}"
            
    # Handle banner file upload
    if 'banner' in request.files:
        file = request.files['banner']
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            import time
            filename = f"banner_{int(time.time())}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(save_path)
            banner_path = f"/static/uploads/{filename}"
            
    if not avatar_path:
        avatar_path = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
        
    if not banner_path:
        banner_path = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200"
        
    cursor.execute(
        "INSERT INTO channels (user_id, name, description, avatar_path, banner_path) VALUES (?, ?, ?, ?, ?)",
        (user_id, name, description, avatar_path, banner_path)
    )
    conn.commit()
    
    # Fetch details
    cursor.execute("SELECT * FROM channels WHERE user_id = ?", (user_id,))
    channel = cursor.fetchone()
    conn.close()
    
    return jsonify({
        'success': True,
        'channel': {
            'id': channel['id'],
            'user_id': channel['user_id'],
            'name': channel['name'],
            'description': channel['description'],
            'avatar_path': channel['avatar_path'],
            'banner_path': channel['banner_path'],
            'created_at': channel['created_at']
        }
    })

# Post Management APIs
@app.route('/api/posts', methods=['GET'])
def get_posts():
    post_type = request.args.get('type') # 'long', 'short', 'text' or None (All)
    search_query = request.args.get('q', '').strip()
    subscribed_only = request.args.get('subscribed') == 'true'
    channel_filter_id = request.args.get('channel_id')
    
    current_uid = session.get('user_id', 0)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT p.*, 
               COALESCE(c.name, u.username) AS channel_name,
               COALESCE(c.avatar_path, '') AS channel_avatar,
               c.id AS channel_db_id,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
               EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS is_liked,
               EXISTS(SELECT 1 FROM subscriptions WHERE subscriber_id = ? AND channel_id = c.id) AS is_subscribed
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN channels c ON c.user_id = u.id
    """
    params = [current_uid, current_uid]
    
    conditions = []
    if post_type:
        conditions.append("p.type = ?")
        params.append(post_type)
        
    if search_query:
        conditions.append("(p.title LIKE ? OR p.content LIKE ? OR u.username LIKE ? OR c.name LIKE ?)")
        search_like = f"%{search_query}%"
        params.extend([search_like, search_like, search_like, search_like])
        
    if subscribed_only and current_uid > 0:
        conditions.append("c.id IN (SELECT channel_id FROM subscriptions WHERE subscriber_id = ?)")
        params.append(current_uid)
        
    if channel_filter_id:
        conditions.append("c.id = ?")
        params.append(channel_filter_id)
        
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
        
    query += " ORDER BY p.created_at DESC"
    
    cursor.execute(query, params)
    posts = []
    for row in cursor.fetchall():
        posts.append({
            'id': row['id'],
            'user_id': row['user_id'],
            'username': row['channel_name'],
            'avatar': row['channel_avatar'],
            'channel_id': row['channel_db_id'],
            'type': row['type'],
            'title': row['title'],
            'content': row['content'],
            'media_path': row['media_path'],
            'thumbnail_path': row['thumbnail_path'],
            'created_at': row['created_at'],
            'likes_count': row['likes_count'],
            'comments_count': row['comments_count'],
            'views': row['views'],
            'is_liked': bool(row['is_liked']),
            'is_subscribed': bool(row['is_subscribed'])
        })
        
    conn.close()
    return jsonify({'posts': posts})

@app.route('/api/posts', methods=['POST'])
def create_post():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please login.'}), 401
    
    # We can receive either form data (for file uploads) or JSON
    post_type = request.form.get('type')
    title = request.form.get('title')
    content = request.form.get('content')
    media_url = request.form.get('media_url') # support external links easily
    
    if not post_type:
        # Fallback to JSON
        data = request.get_json() or {}
        post_type = data.get('type')
        title = data.get('title')
        content = data.get('content')
        media_url = data.get('media_url')
        
    if post_type not in ['long', 'short', 'text']:
        return jsonify({'error': 'Invalid post type.'}), 400
        
    if post_type == 'text' and not content:
        return jsonify({'error': 'Post content is required for text posts.'}), 400
        
    if post_type != 'text' and not title:
        return jsonify({'error': 'Title is required for video posts.'}), 400
        
    media_path = None
    thumbnail_path = None
    
    # Handle video file uploads
    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename != '' and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add unique prefix to avoid naming collisions
            import time
            filename = f"{int(time.time())}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(save_path)
            media_path = f"/static/uploads/{filename}"
    
    # If no file uploaded, fallback to external media_url
    if not media_path and media_url:
        media_path = media_url
        
    if post_type != 'text' and not media_path:
        return jsonify({'error': 'A video file or external video URL is required.'}), 400

    # Handle optional thumbnail upload or set placeholder based on Unsplash
    if 'thumbnail' in request.files:
        thumb_file = request.files['thumbnail']
        if thumb_file and thumb_file.filename != '':
            filename = secure_filename(thumb_file.filename)
            import time
            filename = f"thumb_{int(time.time())}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            thumb_file.save(save_path)
            thumbnail_path = f"/static/uploads/{filename}"
            
    if not thumbnail_path and post_type != 'text':
        # Select some beautiful stock thumbnails depending on types
        if post_type == 'long':
            thumbnail_path = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&auto=format&fit=crop&q=80"
        else:
            thumbnail_path = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
            
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO posts (user_id, type, title, content, media_path, thumbnail_path) VALUES (?, ?, ?, ?, ?, ?)",
        (session['user_id'], post_type, title, content, media_path, thumbnail_path)
    )
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Post created successfully.'})

# Like Toggle API
@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
def toggle_like(post_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please login.'}), 401
        
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if already liked
    cursor.execute("SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?", (user_id, post_id))
    liked = cursor.fetchone()
    
    if liked:
        # Unlike
        cursor.execute("DELETE FROM likes WHERE user_id = ? AND post_id = ?", (user_id, post_id))
        is_liked = False
    else:
        # Like
        cursor.execute("INSERT INTO likes (user_id, post_id) VALUES (?, ?)", (user_id, post_id))
        is_liked = True
        
    conn.commit()
    
    # Fetch new count
    cursor.execute("SELECT COUNT(*) FROM likes WHERE post_id = ?", (post_id,))
    likes_count = cursor.fetchone()[0]
    
    conn.close()
    return jsonify({
        'success': True,
        'is_liked': is_liked,
        'likes_count': likes_count
    })

# Commenting APIs
@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.*, u.username 
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
    """, (post_id,))
    
    comments = []
    for row in cursor.fetchall():
        comments.append({
            'id': row['id'],
            'user_id': row['user_id'],
            'username': row['username'],
            'content': row['content'],
            'created_at': row['created_at']
        })
    conn.close()
    return jsonify({'comments': comments})

@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please login.'}), 401
        
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    
    if not content:
        return jsonify({'error': 'Comment content cannot be empty.'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify post exists
    cursor.execute("SELECT 1 FROM posts WHERE id = ?", (post_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'error': 'Post not found.'}), 404
        
    cursor.execute(
        "INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)",
        (session['user_id'], post_id, content)
    )
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Comment added.'})

# Channel Subscription APIs
@app.route('/api/channels/<int:channel_id>/subscribe', methods=['POST'])
def toggle_subscribe(channel_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please login.'}), 401
        
    subscriber_id = session['user_id']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if channel exists
    cursor.execute("SELECT user_id FROM channels WHERE id = ?", (channel_id,))
    channel = cursor.fetchone()
    if not channel:
        conn.close()
        return jsonify({'error': 'Channel not found.'}), 404
        
    if subscriber_id == channel['user_id']:
        conn.close()
        return jsonify({'error': 'You cannot subscribe to your own channel.'}), 400
        
    # Check if already subscribed
    cursor.execute("SELECT 1 FROM subscriptions WHERE subscriber_id = ? AND channel_id = ?", (subscriber_id, channel_id))
    subscribed = cursor.fetchone()
    
    if subscribed:
        # Unsubscribe
        cursor.execute("DELETE FROM subscriptions WHERE subscriber_id = ? AND channel_id = ?", (subscriber_id, channel_id))
        is_subscribed = False
    else:
        # Subscribe
        cursor.execute("INSERT INTO subscriptions (subscriber_id, channel_id) VALUES (?, ?)", (subscriber_id, channel_id))
        is_subscribed = True
        
    conn.commit()
    
    # Get total subscriber count
    cursor.execute("SELECT COUNT(*) FROM subscriptions WHERE channel_id = ?", (channel_id,))
    subscribers_count = cursor.fetchone()[0]
    
    conn.close()
    return jsonify({
        'success': True,
        'is_subscribed': is_subscribed,
        'subscribers_count': subscribers_count
    })

@app.route('/api/me/subscriptions', methods=['GET'])
def get_my_subscriptions():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized.'}), 401
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.id, c.name, c.avatar_path,
               (SELECT COUNT(*) FROM subscriptions WHERE channel_id = c.id) AS subscribers_count
        FROM subscriptions s
        JOIN channels c ON s.channel_id = c.id
        WHERE s.subscriber_id = ?
        ORDER BY c.name ASC
    """, (session['user_id'],))
    
    channels = []
    for row in cursor.fetchall():
        channels.append({
            'id': row['id'],
            'username': row['name'],
            'avatar': row['avatar_path'],
            'subscribers_count': row['subscribers_count']
        })
    conn.close()
    return jsonify({'subscriptions': channels})

# View tracking endpoint
@app.route('/api/posts/<int:post_id>/view', methods=['POST'])
def increment_view(post_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE posts SET views = views + 1 WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# Update my channel endpoint
@app.route('/api/me/channel/update', methods=['POST'])
def update_my_channel():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please login.'}), 401
        
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if channel exists
    cursor.execute("SELECT * FROM channels WHERE user_id = ?", (user_id,))
    channel = cursor.fetchone()
    if not channel:
        conn.close()
        return jsonify({'error': 'Channel not found.'}), 404
        
    name = request.form.get('name', '').strip()
    description = request.form.get('description', '').strip()
    
    if not name:
        conn.close()
        return jsonify({'error': 'Channel name cannot be empty.'}), 400
        
    avatar_path = channel['avatar_path']
    banner_path = channel['banner_path']
    
    import time
    # Handle avatar upload
    if 'avatar' in request.files:
        file = request.files['avatar']
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            filename = f"avatar_{int(time.time())}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(save_path)
            avatar_path = f"/static/uploads/{filename}"
            
    # Handle banner upload
    if 'banner' in request.files:
        file = request.files['banner']
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            filename = f"banner_{int(time.time())}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(save_path)
            banner_path = f"/static/uploads/{filename}"
            
    cursor.execute(
        "UPDATE channels SET name = ?, description = ?, avatar_path = ?, banner_path = ? WHERE user_id = ?",
        (name, description, avatar_path, banner_path, user_id)
    )
    conn.commit()
    
    # Fetch updated
    cursor.execute("SELECT * FROM channels WHERE user_id = ?", (user_id,))
    updated = cursor.fetchone()
    conn.close()
    
    return jsonify({
        'success': True,
        'channel': {
            'id': updated['id'],
            'user_id': updated['user_id'],
            'name': updated['name'],
            'description': updated['description'],
            'avatar_path': updated['avatar_path'],
            'banner_path': updated['banner_path'],
            'created_at': updated['created_at']
        }
    })

# Channel analytics endpoint
@app.route('/api/me/channel/analytics', methods=['GET'])
def get_channel_analytics():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized. Please login.'}), 401
        
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user has a channel
    cursor.execute("SELECT id FROM channels WHERE user_id = ?", (user_id,))
    channel = cursor.fetchone()
    if not channel:
        conn.close()
        return jsonify({'error': 'You do not have a channel.'}), 404
        
    channel_id = channel['id']
    
    # 1. Total Subscriber Count
    cursor.execute("SELECT COUNT(*) FROM subscriptions WHERE channel_id = ?", (channel_id,))
    subscribers_count = cursor.fetchone()[0]
    
    # 2. Total Views, Likes, Comments across user's posts
    cursor.execute("SELECT COALESCE(SUM(views), 0) FROM posts WHERE user_id = ?", (user_id,))
    total_views = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT COUNT(*) FROM likes l
        JOIN posts p ON l.post_id = p.id
        WHERE p.user_id = ?
    """, (user_id,))
    total_likes = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT COUNT(*) FROM comments c
        JOIN posts p ON c.post_id = p.id
        WHERE p.user_id = ?
    """, (user_id,))
    total_comments = cursor.fetchone()[0]
    
    # 3. Individual posts breakdown
    cursor.execute("""
        SELECT p.*,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
           FROM posts p
           WHERE p.user_id = ?
           ORDER BY p.created_at DESC
    """, (user_id,))
    
    posts = []
    for row in cursor.fetchall():
        posts.append({
            'id': row['id'],
            'type': row['type'],
            'title': row['title'],
            'views': row['views'],
            'likes_count': row['likes_count'],
            'comments_count': row['comments_count'],
            'created_at': row['created_at']
        })
        
    conn.close()
    return jsonify({
        'analytics': {
            'subscribers_count': subscribers_count,
            'total_views': total_views,
            'total_likes': total_likes,
            'total_comments': total_comments,
            'posts': posts
        }
    })

# Error handler for file uploads too large
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File is too large. Maximum size allowed is 50MB.'}), 413

if __name__ == '__main__':
    # Initialize DB file if not exists
    if not os.path.exists(DB_PATH):
        init_db()
    app.run(debug=True, port=5002)
