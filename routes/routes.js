import express from "express";
import passport from "passport";
import { authenticateUser } from "../middleware/middleware.js";
import { User, Post, Reply } from "../models/models.js";

const homeStartingContent =
  "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent =
  "About Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent =
  "Contact Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("main", { req: req });
});

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

router.get(
  "/auth/google/home",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful authentication, redirect to lists.
    res.redirect("/home");
  }
);

router.get("/home", authenticateUser, async (req, res) => {
  const posts = await Post.find({});
  res.render("home.ejs", {
    startingContant: homeStartingContent,
    posts: posts,
    req: req,
  });
});

router.get("/about", (req, res) => {
  res.render("about.ejs", {
    aboutContent: aboutContent,
    req: req,
  });
});

router.get("/contact", (req, res) => {
  res.render("contact.ejs", {
    contactContent: contactContent,
    req: req,
  });
});

router.get("/compose", authenticateUser, (req, res) => {
  res.render("compose.ejs", { req: req });
});

// saving post to the datbase and go back to home page
router.post("/compose", authenticateUser, async (req, res) => {
  const newPost = await new Post({
    postTitle: req.body.postTitle,
    postContent: req.body.postBody,
    author: req.user._id,
  }).save();

  await User.updateOne(
    { _id: req.user._id },
    { $push: { posts: newPost._id } }
  );

  res.redirect("/home");
});

router.post("/reply", authenticateUser, async (req, res) => {
  try {
    const newReply = await new Reply({
      replyContent: req.body.replyBody,
    }).save();

    await Post.updateOne(
      { _id: req.body.postId },
      { $push: { replies: newReply._id } }
    );

    const post = await Post.findById(req.body.postId).populate("replies");
    console.log(post);
    res.render("post", {
      title: post.postTitle,
      content: post.postContent,
      showenPostId: post._id,
      showenPostAuthor: post.author,
      repliesList: post.replies,
      req: req,
    });
    console.log(post.postTitle);
    console.log(post.replies);
  } catch (error) {
    console.log(error);
  }
});

router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.post("/register", async (req, res) => {
  try {
    await User.register({ username: req.body.username }, req.body.password);
    passport.authenticate("local")(req, res, () => {
      res.redirect("/home");
    });
  } catch (err) {
    console.error(err);
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });

    // Wrap the asynchronous operation in a Promise to use await
    await new Promise((resolve, reject) => {
      req.login(user, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    passport.authenticate("local")(req, res, () => {
      res.redirect("/home");
    });
  } catch (err) {
    console.error(err);
    // Handle the error, for example, redirecting to a login page
    res.redirect("/home");
  }
});

// showing the post in another page
router.get("/posts/:postId", authenticateUser, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate("replies");
    res.render("post.ejs", {
      title: post.postTitle,
      content: post.postContent,
      showenPostId: post._id,
      showenPostAuthor: post.author,
      repliesList: post.replies,
      req: req,
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).send("Internal Server Error");
  }
});

// deleting the shown post
router.post("/delete", authenticateUser, async (req, res) => {
  try {
    // Find the post and its replies
    const post = await Post.findById(req.body.postId).populate("replies");
    const replies = post.replies;

    // Delete the replies
    for (const reply of replies) {
      await Reply.findByIdAndDelete(reply._id);
    }

    // Delete the post
    await Post.findByIdAndDelete(req.body.postId);

    // Update user's posts array
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { $pull: { posts: req.body.postId } },
      { new: true }
    );

    res.redirect("/home");
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).send("Internal Server Error");
  }
});

export { router as routes };
