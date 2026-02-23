import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { pool } from "../db.js";

export default function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;

          const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
          );

          let user;

          if (result.rows.length === 0) {
            const newUser = await pool.query(
              "INSERT INTO users (email, role) VALUES ($1, $2) RETURNING *",
              [email, "user"]
            );
            user = newUser.rows[0];
          } else {
            user = result.rows[0];
          }

          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}