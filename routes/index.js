var express = require('express');
var router = express.Router();
const userModel = require("../models/users");
const postModel = require("./posts");
const bcrypt = require('bcrypt');
const upload = require("./multer");
const fetch = require("node-fetch");

router.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/feed');
  res.render('index');
});

router.get('/login', function(req, res) {
   res.render('login',{error : null,nav:false});
});

router.get('/register', function(req, res) {
   res.render('register',{nav:false});
});

router.get('/feed', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findById(req.session.userId);
    const userPosts = await postModel.find().populate("user").exec();

    let unsplashPosts = [];
    try {
      const [nature, travel, food, fashion] = await Promise.all([
        fetch(`https://api.unsplash.com/photos/random?count=20&topic=nature&client_id=-p23DG2BaSw-hntVeQpFbdUypqmBdUIDucKittz1NtM`).then(r => r.json()),
        fetch(`https://api.unsplash.com/photos/random?count=20&topic=travel&client_id=-p23DG2BaSw-hntVeQpFbdUypqmBdUIDucKittz1NtM`).then(r => r.json()),
        fetch(`https://api.unsplash.com/photos/random?count=20&topic=food-drink&client_id=-p23DG2BaSw-hntVeQpFbdUypqmBdUIDucKittz1NtM`).then(r => r.json()),
        fetch(`https://api.unsplash.com/photos/random?count=20&topic=fashion&client_id=-p23DG2BaSw-hntVeQpFbdUypqmBdUIDucKittz1NtM`).then(r => r.json()),
      ]);
      unsplashPosts = [...nature, ...travel, ...food, ...fashion];
    } catch(err) {
      console.log("Unsplash fetch failed:", err.message);
    }

    res.render('feed', { user: user, posts: userPosts, unsplashPosts: unsplashPosts, searchQuery: '' });
  } catch(err) {
    next(err);
  }
});

// Explore → same as feed
router.get('/explore', isLoggedIn, async function(req, res, next) {
  res.redirect('/feed');
});

router.get('/search', isLoggedIn, async function(req, res) {
  try {
    const query = req.query.q;
    const user = await userModel.findById(req.session.userId);
    
    // Search in database posts
    const userPosts = await postModel.find({
      imageText: { $regex: query, $options: 'i' }
    }).populate("user").exec();

    // Search in Unsplash
    let unsplashPosts = [];
    try {
      const response = await fetch(`https://api.unsplash.com/search/photos?query=${query}&per_page=20&client_id=-p23DG2BaSw-hntVeQpFbdUypqmBdUIDucKittz1NtM`);
      const data = await response.json();
      unsplashPosts = data.results;
    } catch(err) {
      console.log("Unsplash search failed:", err.message);
    }

    res.render('feed', { user: user, posts: userPosts, unsplashPosts: unsplashPosts, searchQuery: query });
  } catch(err) {
    next(err);
  }
});

router.post('/upload',isLoggedIn, upload.single('file'), async function(req, res,next) {
  if (!req.file) {
    return res.status(404).send('No file uploaded.');
  }
  const user = await userModel.findById( req.session.userId);
  const post = await postModel.create({
    image: req.file.filename,
    imageText: req.body.filecaption,
    user: user._id
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});


router.get('/profile', isLoggedIn, async function(req, res,next) {
  const user = await userModel.findById(req.session.userId).populate("posts");
   res.render('profile' , { user: user, nav: true });
});

router.post('/update-dp', isLoggedIn, upload.single('dp'), async function(req, res) {
  try {
    const user = await userModel.findById(req.session.userId);
    user.dp = req.file.path;  // Change req.file.filename to req.file.path
    await user.save();
    res.redirect('/profile');
  } catch(err) {
    console.error('Update DP error:', err);
    res.status(500).send("Error: " + err.message);
  }
});

// router.post('/update-dp', isLoggedIn, upload.single('dp'), async function(req, res) {
//   const user = await userModel.findById(req.session.userId);
//   user.dp = req.file.filename;
//   await user.save();
//   res.redirect('/profile');
// });

router.get('/posts', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findById(req.session.userId).populate("posts");
  res.render('posts', { user: user, nav: true });
});

router.get('/post/:id', isLoggedIn, async function(req, res) {
  try {
    const post = await postModel.findById(req.params.id).populate("user");
    res.render('postDetail', { post: post });
  } catch(err) {
    next(err);
  }
});

router.post('/register', async function(req, res) {
  try {
    const { username, email, fullname, password } = req.body;

    const existingUser = await userModel.findOne({ username: username });
    if (existingUser) {
      return res.send("Username exists! <a href='/register'>Try again</a>");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userModel.create({
      username: username,
      email: email,
      fullname: fullname,
      password: hashedPassword
    });

    res.redirect('/login');

  } catch(err) {
    res.send("Error: " + err.message + " <a href='/register'>Try again</a>");
  }
});

router.post('/login', async function(req, res) {
  try {
    const { username, password } = req.body;

    const user = await userModel.findOne({ username: username });
    if (!user) {
      return res.send("User not found! <a href='/login'>Try again</a>");
    }

   const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.send("Wrong password! <a href='/login'>Try again</a>");
    }

    req.session.userId = user._id.toString();
    res.redirect('/feed');

  } catch(err) {
    res.send("Login failed: " + err.message);
  }
});

router.get("/logout", function(req, res) {
  req.session.destroy(function(err) {
    res.redirect('/login');
  });
});

function isLoggedIn(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect("/login");
}

module.exports = router;

