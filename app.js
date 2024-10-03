//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose =  require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
  name : String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name : String,
  items : [itemsSchema]
};

const List = mongoose.model("List", listSchema);




app.get("/", async function(req, res) {
  try {
    const foundItems = await Item.find({});

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems)
      .then(() => {
        console.log("Successfully saved default items to DB");
      })
      .catch((err) => {
        console.log(err);
      });

      res.redirect("/");

    }else{
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/:customListName", async function(req, res) { 
  const customListName = _.capitalize(req.params.customListName);
  console.log(customListName);

  try {
    const foundList = await List.findOne({name: customListName});
    
    if (!foundList) {
      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      await list.save();
      res.redirect("/" + customListName);
    } else {
      // Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error occurred while fetching list.");
  }
});

  

app.post("/", async function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    await item.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({name: listName});
      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      }
    } catch (err) {
      console.log(err);
      res.status(500).send("Error occurred while adding item to the list.");
    }
  }
});



app.post("/delete", async function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    try {
      await Item.findByIdAndDelete(checkedItemId);
      console.log("Successfully deleted checked item.");
      res.redirect("/");
    } catch (err) {
      console.log(err);
      res.status(500).send("Error occurred while deleting the item.");
    }
  } else {
    try {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + listName);
    } catch (err) {
      console.log(err);
      res.status(500).send("Error occurred while updating the list.");
    }
  }
  

  
});



app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
