section_list = [{
    "label": "A Different Label",
    "other_data": "Other Data",
},
{
    "label": "Reel Reassignment",
    "more_data": "More Data",
}]

# Filter through the list to find the object with the specified attribute in get ("label")
reassign_section = next(filter(lambda s: s.get("label") == "Reel Reassignment", section_list))

print(reassign_section)
