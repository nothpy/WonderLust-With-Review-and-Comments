const express = require("express");
const app = express();
const port = 8080;
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require('ejs-mate');

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const wrapAsync = require("./util/wrapAsync.js");
const ExpressError = require("./util/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");

const MONGO_URL = 'mongodb://127.0.0.1:27017/wonderlust';
main().then((res) => {
    console.log("connection succesfully created");
}).catch(err => console.log(err));
async function main() {
    await mongoose.connect(MONGO_URL);
}

const validateListing = (req, res , next) =>{
    let { error } = listingSchema.validate(req.body);
    if(error)
    {
        // const msgError = error.details.map((el) => el.message).join(", ");
        // throw new ExpressError(400, msgError);
        throw new ExpressError(400, error);
    }
    else{
        next();
    }
};

const validateReview = (req, res , next) =>{
    let { error } = reviewSchema.validate(req.body);
    if(error)
    {
        // const msgError = error.details.map((el) => el.message).join(", ");
        // throw new ExpressError(400, msgError);
        throw new ExpressError(400, error);
    }
    else{
        next();
    }
};



// function wrapAsync(fn){
//     return function(req, res, next){
//         fn(req, res, next).catch(next);
//     };
// }
app.get("/", async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
    // res.send("Server working at this route");
});

/** 
app.get("/testlisting", async (req, res)=>{
    let sampleListing = new Listing({
        title:"My new villa",
        description:"by the beach",
        price:12200,
        location:"Mumbai",
        country: "India"
    });
    await sampleListing.save();
    console.log("sample data saved");
    res.send("successful testing")
});*/

//index Route 
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));

// new Route 
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs")
});

//show Route--> it show individual listings data 
app.get("/listings/:id",wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs", { listing });
}));

// Create route 
app.post("/listings", validateListing  , wrapAsync(async (req, res, next) => {
    // let {title, description, price, location, country} = req.body; reither tha we can use it
    // let listing = req.body.listing;
   /* if(!req.body.listing)
    {
        throw new ExpressError(400, " Send valid data for listing");
    }
    if(!newListing.title)
    {
        throw new ExpressError(400, "Title is missing");
    }
    if(!newListing.description)
    {
        throw new ExpressError(400, "Description is missing");
    }
    if(!newListing.location)
    {
        throw new ExpressError(400, "Location is missing");
    }*/
    // let result =  listingSchema.validate(req.body);
    // console.log(result);
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");

}));

// Edit Route 
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });

}));

// update route

app.put("/listings/:id", validateListing  ,wrapAsync( async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
}));

// Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

//REVIEWS post route
app.post("/listing/:id/reviews", validateReview, wrapAsync(async (req, res)=>{
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    // console.log("new review saved");
    // res.send("new review saved");
    res.redirect(`/listings/${listing._id}`);
}));


// Delete Review route
app.delete("/listings/:id/reviews/:reviewId", wrapAsync( async (req, res)=>{
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, {$pull: { reviews:reviewId }});
    await Review.findById(reviewId);
    res.redirect(`/listings/${id}`);
}));


// Error Handling middleware 
app.all("*", (req, res, next)=>{
    // next(new ExpressError(404, "Page Not Found"));
    res.render("listings/errorPage.ejs");
});

app.use((err, req, res, next)=>{
    let {statusCode=500 , message="Something went wrong" } = err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("Error.ejs", {err});
});

app.listen(port, () => {
    console.log(`server running on port: ${port}`);
});
