var express = require("express");
var router = express.Router();
var db = require("../core/db");
var utils = require("../core/utils");
var fs = require("fs");
var path = require('path');
var multer  =   require('multer');
var crypto = require("crypto");

const IMAGES_PATH = "../uploadedImgs";

//var storage = multer({dest: path.join(__dirname, IMAGES_PATH)});
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, IMAGES_PATH));
    },
    filename: function (req, file, cb) {
      var randString = crypto.randomBytes(10).toString('hex');
      var fileExt = file.originalname.split(".").pop();
      cb(null, randString + "_" + Date.now() + "." + fileExt);
    }
  });
  
  var upload = multer({ storage: storage });

router.all('*', function (req, res, next) {
	console.log(path.basename(module.filename) +', ' + req.url);
	next();
});

//  Adds a given post to DB.
router.post("/addPost",upload.any(), function (req, res, next) {	

    var imgs = req.files.map(function(img) {
        return { imagePath : IMAGES_PATH + "/" + img.filename };
    });

    db.getUserByLogin(req.session.user, function(user) {
        db.addPost({ text: req.body.postText, privacy: req.body.privacy, 
                     writtenTo: req.body.userId, writtenBy: user.id }, imgs, function(postDB) {
                                      
            res.send([postDB]);
        });
    });
});


router.post("/addComment", function (req, res) {	
    db.getUserByLogin(req.session.user, function(user) {
        db.addComment({ postId: req.body.postId, userId: user.id, text: req.body.text} , function(commentDB){ 
            res.send([commentDB]);
        });
    });
});

//	Get a specific post.
router.get("/getPost/:id", function(req, res) {
	db.getPostById(req.params.id, function(post) {
       // res.send([post]);
	});
});

//	Get the posts of specific user.
router.get("/getPostsToUser/:userId", function(req, res) {
/* 	db.getUserPosts(req.params.userId, function(posts) {
		res.send(posts);
    }); */
    db.getPostsToUser(req.params.userId, function(posts) {
        res.send(posts);
    });
});

//	Get the comments of specific post.
router.get("/getPostComments/:postId", function(req, res) {
	db.getPostComments(req.params.postId, function(comments) {
		res.send(comments);
    });
});

//	Get the likes of specific post.
router.get("/getPostLikes/:postId", function(req, res) {
	db.getPostLikes(req.params.postId, function(likesDB) {
        //console.log("ppppppppppppppppppppppppppppppppppppppppppp "+ JSON.stringify(req.session.user));
        //  *Return the given postId - in case there is no likes of post, (before to know in which post update the likes)
            //res.send({likes : likesDB, postId : req.params.postId});
            res.send(likesDB);
        });
});

 //	Get images names array of specific post by given post Id.
router.get("/getPostImages/:postId", function(req, res){
    
    var imgsNames = [];
    db.getPostImages(req.params.postId, function(imgsFromDB) {
        imgsFromDB.forEach(function(imgFromDB) {
            imgsNames.push({name : (imgFromDB.imagePath).split('/').pop(), postId : req.params.postId });
        }, this);
        res.send(imgsNames);
    });
});

//  Adds like of specific user to specific post
router.get("/addLike/:postId", function(req, res) {
    db.getUserByLogin(req.session.user, function(user){      
        db.addPostLike(user.id, req.params.postId, function(LikeDB){
            res.send([LikeDB]);
        });
    });
});

//  Removes like of user from specific post
router.get("/removeLike/:postId", function(req, res) {
    db.getUserByLogin(req.session.user, function(user){   
        db.removePostLike(user.id, req.params.postId, function(LikeDB){
            res.send([LikeDB]);
        });
    });
});

//  Removes post by ID.
router.get("/removePost/:postId", function(req, res) {

    db.removePost(req.params.postId);
});


/* //	Get all posts.
router.get("/getPosts", function(req, res) {
	db.getAllPosts(function(posts){
        console.log("Retrieving post " + JSON.stringify(posts));
		res.send(posts);
	});
}); */

module.exports = router;