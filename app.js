const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));   // all files will be stored in public folder

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true} )     // deprecassion warning, todolist is new Database that we will create

const itemsSchema = new mongoose.Schema({      // schema for mongodb 
    name: String
})

const Item = mongoose.model("Item", itemsSchema)  // mongoose model to create a collection named "Items" and schema itemsSchema

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item"
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {                                    // we want other lists to be different then the homepage
    name: String,
    items: [itemsSchema]                                           // 2nd parameter will be items with value as an array of itemSchema based items
}

const List = mongoose.model("List", listSchema);          // Model created from Schema 

app.get("/", function(req, res){

    // let today = new Date();

    // let options = {
    //     weekday: "long",
    //     day: "numeric",
    //     month: "long"
    // };

    // let day = today.toLocaleDateString("en-US", options); // to use this function we need to create an object defining 

    Item.find({}, function(err, foundItems){   // find() function of mongo, 1st paramater is full array therefore blank {}, foundItems is going to be contents found inside the items
        
        if(foundItems.length === 0){
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                } else{
                    console.log("Successfull! saved default items to DB.")
                }
            }); res.redirect("/"); // after adding the default the length will be more than 0 therefore it will fall under else category
        } else{
            res.render("list", {listTitle: "Today", newListItems: foundItems}); // first render list.ejs file
        }
        
    });

});

app.post("/", function(req, res){  // after the user enters the value in the input field we can access in post request
    
    const itemName = req.body.newItem;    // in req.body we can can access newitem input field and the button since they have names
    const listName = req.body.list;

    // console.log(req.body)
    
    // if(req.body.button === "Work"){   // imp, since we gave the name of listTitle as Work(space)List the name of button will be saved as Work
    //     workItems.push(item);
    //     res.redirect("/work");
    // }
    // else{
    //     items.push(item);
    //     res.redirect("/");
    // }                                // remember the name of let item is changed to itemName

    const item = new Item({
        name: itemName                   // this is the new item which we would like to push
    })

    if(listName === "Today"){
        item.save()                        // that is for insertOne() in mongodb
        res.redirect("/");                 // redirecting so that the new item can be displayed in else condition of find()
    } else{
        List.findOne({name: listName}, function(err, foundList){    // we will try to find list namedd listName custom list
            foundList.items.push(item);         // we can then tap into foundList and push new items in it
            foundList.save();                   // update with our new data
            res.redirect("/" + listName);       // instead of redirecting to the home route we need to redirect from where the user came
        });
    }

    
})

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err){  // callback function is really important for findByIDandRemove or else it will not execute it
            if(err){
                console.log(err)
            } else {
                console.log(`Successfully removed item: ${checkedItemId}`)
                res.redirect("/");
            }
        });
    } else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }
    
})

app.get("/:customListName", function(req, res){      // Express route parameters is used to create dynamic routes
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){   // if a collection already exists with a particular name then we will divert it to that list 
        if(!err){                                                    //rather than creating
            if(!foundList){
                //create a new list
                //console.log("Doesn't exist!");
                const list = new List({                              // if it doesn't exist then create it
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else{
                // console.log("Exists!");
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items})   // redirect to list with title foundlist is the list which gets returned to ejs
            }
        }
    })
    
})

app.get("/work", function(req, res){
    res.render("list", {listTitle: "Work List", newListItems: workItems});

})

// app.post("/work", function(req, res){
//     let item = req.body.newItem;
//     workItems.push(item);
//     res.redirect("/")
// })

app.listen(3000, function(){
    console.log("Server is running at port 3000")
})