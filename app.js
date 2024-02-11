import "dotenv/config";
import express from "express";
import session from "express-session";
import { connectToDatabase } from "./config/database.js";
import { routes } from "./routes/routes.js";
import passport from "passport";
import "./config/auth.js";

export const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Connect to the database
connectToDatabase();

// Use routes
app.use("/", routes);

app.listen(port, () => {
  console.log(`Listing on port ${port}`);
});
