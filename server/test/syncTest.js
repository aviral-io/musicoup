import roomManager from '../src/roomManager.js';
import assert from 'assert';

console.log('🧪 Running MusiCoup Core Logic Verification Tests...\n');

// Test 1: Room Creation
console.log('Test 1: Creating Couple Room...');
const hostSocket = 'socket-host-1';
const room = roomManager.createRoom({
  name: 'Our Cozy Corner',
  mode: 'couple',
  hostName: 'Rahul',
  socketId: hostSocket,
  avatar: '💖'
});

assert.strictEqual(room.mode, 'couple');
assert.strictEqual(room.users.length, 1);
assert.strictEqual(room.users[0].name, 'Rahul');
console.log('✅ Room created successfully with code:', room.code);

// Test 2: Joining the Couple Room
console.log('\nTest 2: Partner Joining Couple Room...');
const partnerSocket = 'socket-partner-2';
const joinResult = roomManager.joinRoom({
  code: room.code,
  name: 'Priya',
  socketId: partnerSocket,
  avatar: '🌹'
});

assert(!joinResult.error, 'Join should succeed');
assert.strictEqual(joinResult.room.users.length, 2);
assert.strictEqual(joinResult.room.users[1].name, 'Priya');
console.log('✅ Partner joined successfully. Members:', joinResult.room.users.map(u => u.name));

// Test 3: Couple Room Capacity Limit (Max 2)
console.log('\nTest 3: Testing Couple Room 2-member limit...');
const thirdUserSocket = 'socket-third-3';
const thirdJoin = roomManager.joinRoom({
  code: room.code,
  name: 'Sneaky Third Person',
  socketId: thirdUserSocket
});
assert(thirdJoin.error, 'Third person should be rejected in Couple Mode');
console.log('✅ Third person correctly rejected in Couple Mode:', thirdJoin.error);

// Test 4: Adding Song to Queue (Auto-play when empty)
console.log('\nTest 4: Adding first track to queue...');
const song1 = {
  id: 'dQw4w9WgXcQ',
  title: 'Never Gonna Give You Up',
  artist: 'Rick Astley',
  thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  duration: 213,
  durationFormatted: '3:33',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
};

const updatedRoom1 = roomManager.addToQueue({
  code: room.code,
  song: song1,
  socketId: hostSocket,
  socketName: 'Rahul'
});

assert.strictEqual(updatedRoom1.currentSong.id, song1.id);
assert.strictEqual(updatedRoom1.playback.status, 'playing');
console.log('✅ Song auto-played when queue was empty:', updatedRoom1.currentSong.title);

// Test 5: Adding second track to queue
console.log('\nTest 5: Adding second track to queue...');
const song2 = {
  id: 'JGwWNGJdvx8',
  title: 'Shape of You',
  artist: 'Ed Sheeran',
  thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg',
  duration: 233,
  durationFormatted: '3:53',
  url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8'
};

const updatedRoom2 = roomManager.addToQueue({
  code: room.code,
  song: song2,
  socketId: partnerSocket,
  socketName: 'Priya'
});

assert.strictEqual(updatedRoom2.queue.length, 1);
assert.strictEqual(updatedRoom2.queue[0].title, song2.title);
console.log('✅ Second song added to upcoming queue:', updatedRoom2.queue[0].title);

// Test 6: Interpolated Time & Playback update
console.log('\nTest 6: Updating playback to pause and seek...');
roomManager.updatePlayback({
  code: room.code,
  status: 'paused',
  currentTime: 45,
  socketId: hostSocket
});

assert.strictEqual(room.playback.status, 'paused');
assert.strictEqual(room.playback.currentTime, 45);
console.log('✅ Playback successfully updated: Status = paused, CurrentTime = 45s');

// Test 7: Skip track & Anti-Double-Skip debounce check
console.log('\nTest 7: Testing Track Skip & Debounce...');
const beforeSkip = room.currentSong.title;
roomManager.playNext({ code: room.code });
assert.strictEqual(room.currentSong.title, song2.title, 'Current song should now be song2');

// Immediate second call should be ignored by debounce
roomManager.playNext({ code: room.code });
assert.strictEqual(room.currentSong.title, song2.title, 'Duplicate immediate skip should be ignored');
console.log('✅ Skip passed and duplicate skip was successfully blocked by debounce!');

// Test 8: Chat & Couple Notes
console.log('\nTest 8: Testing Chat & Shared Love Note...');
const chatMsg = roomManager.addChatMessage({
  code: room.code,
  senderId: partnerSocket,
  senderName: 'Priya',
  text: 'Love this song! 💕'
});
assert.strictEqual(chatMsg.text, 'Love this song! 💕');

roomManager.updateCoupleNotes({
  code: room.code,
  notes: 'Our favorite romantic list'
});
assert.strictEqual(room.coupleNotes, 'Our favorite romantic list');
console.log('✅ Chat message and shared couple note saved successfully!');

// Test 9: Leaving room
console.log('\nTest 9: Testing user leaving room...');
const leaveRes = roomManager.leaveRoom(hostSocket);
assert.strictEqual(room.users.length, 1);
assert.strictEqual(room.hostId, partnerSocket, 'Host should be automatically reassigned to Priya');
assert.strictEqual(room.users[0].isHost, true);
console.log('✅ Host reassignment on disconnect works perfectly! New host:', room.users[0].name);

console.log('\n🎉 ALL 9 CORE TESTS PASSED SUCCESSFULLY! 🚀');

