const express = require('express');
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-dimitry:Test123@cluster0.saxoldw.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
    name: String
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
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



app.get('/', (req, res) => {
    Item.find({})
        .then(savedItems => {
            if (savedItems.length === 0) {
                Item.insertMany(defaultItems)
                    .then(() => {
                        console.log("Successfully saved default items to DB.");
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                res.redirect("/");
            }
            else {
                res.render("list", { listTitle: "Today", items: savedItems, route: "/" });
            }
        })
        .catch(err => {
            console.log(err);
            res.redirect("/");
        });
});

app.post('/', (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({
        name: itemName
    });

    if (listName === "Today") {
        newItem.save();
        res.redirect('/');
    } 
    else {
        List.findOne({ name: listName })
            .then(foundList => {
                foundList.items.push(newItem);
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch(err => {
                console.log(err);
            });
    }
});

app.post('/delete', (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId)
            .then(() => {
                res.redirect("/");
            })
            .catch(err => {
                console.log(err);
            }
        );
    }
    else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } }}) 
        .then(() => {
            res.redirect("/" + listName);   
        })
        .catch(err => {
            console.log(err);
        });
    }
});

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName })
        .then(foundList => {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                res.render("list", { listTitle: list.name, items: list.items, route: list.name });
            }
            else {
                res.render("list", { listTitle: foundList.name, items: foundList.items, route: foundList.name });
            }
        })
        .catch(err => {
            console.log(err);
        });
});

app.listen(process.env.PORT || 3000, () => {
    console.log('App listening on port 3000!');
});