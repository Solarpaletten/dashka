// backend/src/config/cors.js
// v1.2.4 — whitelist: localhost + onrender

const allowedOrigins = [
  'http://localhost',
  'http://localhost:80',
  'http://localhost:5173',
  'https://dashka.onrender.com',
]

module.exports = {
  origin: function (origin, callback) {
    // allow requests with no origin (curl, mobile, server-to-server)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}
