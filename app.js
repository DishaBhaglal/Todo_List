//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});


const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const wake = new Item({
  name: "Wake up"
});

const fresh = new Item({
  name: "Freshen up"
});

const workout = new Item({
  name: "Workout"
});

const defaultItems = [wake, fresh, workout];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, items){

    if (items.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("Successully added the default items");
        }
      });
      res.redirect("/");
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: items});
    }

  });
});

app.get("/:listName", function(req, res){
  const listName = _.capitalize(req.params.listName);

  List.findOne({name: listName}, function(err, foundList){
    if(!err){
      if(!foundList){
        // Create a new list
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + listName);
      }
      else{
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })
});

app.post("/", function(req, res){

  const newItem = req.body.newItem;
  const listName = req.body.list;

  const addItem = new Item({
    name: newItem
  });

  if(listName === "Today"){
    addItem.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName}, function(err, foundList){
      if(!err){
        foundList.items.push(addItem);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }

  
});

app.post("/delete", function(req, res){
  const itemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(itemId, function(err){
    if(err){
      console.log(err);
    }
    else{
      console.log("Successfully removed the chosen item");
      res.redirect("/");
    }
  })
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
  
})


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
