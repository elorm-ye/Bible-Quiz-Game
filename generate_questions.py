import json
import random

questions_data = [
    ("What was the first plague of Egypt?", ["Frogs", "Blood", "Locusts", "Boils"], "Blood", "Old Testament", "multiple_choice", "easy", "Exodus 7", "The Nile turned red."),
    ("Who was the first king of Israel?", ["Saul", "David", "Solomon", "Samuel"], "Saul", "Kings & Prophets", "multiple_choice", "easy", "1 Samuel 9", "He was very tall."),
    ("What is the last book of the Old Testament?", ["Zechariah", "Malachi", "Matthew", "Micah"], "Malachi", "Deep Doctrine", "multiple_choice", "medium", "Malachi", "Look at the end of the OT."),
    ("How many tribes of Israel were there?", ["10", "12", "14", "7"], "12", "Old Testament", "multiple_choice", "easy", "Genesis 49", "Same as the number of disciples."),
    ("Who was the oldest man in the Bible?", ["Adam", "Moses", "Methuselah", "Noah"], "Methuselah", "Old Testament", "multiple_choice", "medium", "Genesis 5", "He lived 969 years."),
    ("For the wages of sin is _, but the gift of God is eternal life in Christ Jesus our Lord.", [], "death", "Fill in the Blanks", "fill_blank", "medium", "Romans 6:23", "The opposite of life."),
    ("I am the Alpha and the Omega, the First and the Last, the Beginning and the _.", [], "End", "Fill in the Blanks", "fill_blank", "medium", "Revelation 22:13", "The opposite of beginning."),
    ("God created Eve from Adam's rib.", ["True", "False"], "True", "True or False", "true_false", "easy", "Genesis 2:21-22", "A bone from his side."),
    ("Moses entered the Promised Land.", ["True", "False"], "False", "True or False", "true_false", "medium", "Deuteronomy 34", "He only saw it from a mountain."),
    ("I was a tax collector before Jesus called me. Who am I?", ["Luke", "Matthew", "John", "Peter"], "Matthew", "Who Am I?", "who_am_i", "easy", "Matthew 9:9", "Also known as Levi."),
    ("Who wrote the Book of Acts?", ["Paul", "Peter", "Luke", "John"], "Luke", "New Testament", "multiple_choice", "hard", "Acts 1", "The beloved physician."),
    ("Which city's walls fell after the Israelites marched around them?", ["Jerusalem", "Jericho", "Babylon", "Nineveh"], "Jericho", "Old Testament", "multiple_choice", "easy", "Joshua 6", "Joshua led the charge."),
    ("Who interpreted Pharaoh's dreams about cows and grain?", ["Moses", "Daniel", "Joseph", "Jacob"], "Joseph", "Characters", "multiple_choice", "medium", "Genesis 41", "He wore a coat of many colors."),
    ("To what city did God tell Jonah to go?", ["Tarshish", "Nineveh", "Jerusalem", "Damascus"], "Nineveh", "Old Testament", "multiple_choice", "medium", "Jonah 1", "He tried to flee to Tarshish instead."),
    ("I betrayed Jesus for 30 pieces of silver. Who am I?", ["Peter", "Judas", "Thomas", "John"], "Judas", "Who Am I?", "who_am_i", "easy", "Matthew 26:15", "The treasurer of the disciples."),
    ("What was the name of the garden where Adam and Eve lived?", ["Gethsemane", "Eden", "Olives", "Sinai"], "Eden", "Old Testament", "multiple_choice", "easy", "Genesis 2", "The first garden."),
    ("How many days and nights did it rain during Noah's flood?", ["7", "12", "30", "40"], "40", "Old Testament", "multiple_choice", "easy", "Genesis 7", "A common biblical number for testing."),
    ("Who was swallowed by a great fish?", ["Peter", "Jonah", "Moses", "Paul"], "Jonah", "Characters", "multiple_choice", "easy", "Jonah 1", "He ran from God."),
    ("Who killed Goliath?", ["Saul", "Jonathan", "David", "Samson"], "David", "Characters", "multiple_choice", "easy", "1 Samuel 17", "A shepherd boy."),
    ("The love of _ is a root of all kinds of evil.", [], "money", "Fill in the Blanks", "fill_blank", "medium", "1 Timothy 6:10", "Wealth or currency."),
    ("I can do all things through _ who strengthens me.", [], "Christ", "Fill in the Blanks", "fill_blank", "easy", "Philippians 4:13", "The Messiah."),
    ("David was the first king of Israel.", ["True", "False"], "False", "True or False", "true_false", "medium", "1 Samuel 9", "Saul was first."),
    ("Paul was originally known as Saul.", ["True", "False"], "True", "True or False", "true_false", "easy", "Acts 9", "He was from Tarsus."),
    ("I denied Jesus three times before the rooster crowed. Who am I?", ["Judas", "Peter", "Thomas", "John"], "Peter", "Who Am I?", "who_am_i", "easy", "Matthew 26:75", "He walked on water."),
    ("Who was the mother of John the Baptist?", ["Mary", "Martha", "Elizabeth", "Hannah"], "Elizabeth", "New Testament", "multiple_choice", "hard", "Luke 1", "A relative of Mary."),
    ("What did God provide for the Israelites to eat in the wilderness?", ["Bread and cheese", "Manna and quail", "Fruit and nuts", "Fish and loaves"], "Manna and quail", "Miracles", "multiple_choice", "medium", "Exodus 16", "Bread from heaven."),
    ("Who was thrown into the lion's den?", ["Joseph", "Daniel", "David", "Shadrach"], "Daniel", "Characters", "multiple_choice", "easy", "Daniel 6", "He prayed three times a day."),
    ("Which disciple doubted Jesus' resurrection until he saw Him?", ["Peter", "John", "Judas", "Thomas"], "Thomas", "New Testament", "multiple_choice", "easy", "John 20", "Known as 'Doubting'."),
    ("Where did Jesus turn water into wine?", ["Jerusalem", "Cana", "Bethlehem", "Nazareth"], "Cana", "Miracles", "multiple_choice", "medium", "John 2", "At a wedding feast."),
    ("Who was the giant that David defeated?", ["Goliath", "Samson", "Saul", "Naboth"], "Goliath", "Characters", "multiple_choice", "easy", "1 Samuel 17", "A Philistine champion."),
    ("I was originally a persecutor of the church but became its greatest missionary. Who am I?", ["Peter", "Paul", "Stephen", "Barnabas"], "Paul", "Who Am I?", "who_am_i", "easy", "Acts 9", "Formerly known as Saul."),
    ("In the beginning God created the heavens and the _.", [], "earth", "Fill in the Blanks", "fill_blank", "easy", "Genesis 1:1", "The planet we live on."),
    ("The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and _-control.", [], "self", "Fill in the Blanks", "fill_blank", "medium", "Galatians 5:22-23", "Discipline over oneself."),
    ("Jesus was baptized by Peter.", ["True", "False"], "False", "True or False", "true_false", "easy", "Matthew 3", "It was John the Baptist."),
    ("Noah took clean animals into the ark by sevens.", ["True", "False"], "True", "True or False", "true_false", "hard", "Genesis 7:2", "Not just two by two for clean animals."),
    ("Who was the wife of Abraham?", ["Rebekah", "Rachel", "Sarah", "Leah"], "Sarah", "Old Testament", "multiple_choice", "medium", "Genesis 17", "Her original name was Sarai."),
    ("What was the sign of God's covenant with Noah?", ["A dove", "An olive branch", "A rainbow", "A star"], "A rainbow", "Old Testament", "multiple_choice", "easy", "Genesis 9", "A colorful bow in the clouds."),
    ("Who built the first temple in Jerusalem?", ["David", "Solomon", "Hezekiah", "Josiah"], "Solomon", "Kings & Prophets", "multiple_choice", "medium", "1 Kings 6", "David's son."),
    ("What was the name of the blind man Jesus healed in Jericho?", ["Bartimaeus", "Zacchaeus", "Lazarus", "Nicodemus"], "Bartimaeus", "Miracles", "multiple_choice", "hard", "Mark 10:46", "Son of Timaeus."),
    ("Who climbed a sycamore tree to see Jesus?", ["Peter", "Zacchaeus", "Matthew", "John"], "Zacchaeus", "Characters", "multiple_choice", "medium", "Luke 19", "A short tax collector."),
    ("I am the way, the _, and the life.", [], "truth", "Fill in the Blanks", "fill_blank", "easy", "John 14:6", "Not a lie."),
    ("Jesus wept is the shortest verse in the English Bible.", ["True", "False"], "True", "True or False", "true_false", "easy", "John 11:35", "It contains only two words."),
    ("Elijah was taken up to heaven in a whirlwind.", ["True", "False"], "True", "True or False", "true_false", "medium", "2 Kings 2", "With chariots of fire."),
    ("I washed my hands of Jesus' blood during His trial. Who am I?", ["Herod", "Caesar", "Pilate", "Caiaphas"], "Pilate", "Who Am I?", "who_am_i", "medium", "Matthew 27:24", "The Roman governor."),
    ("Who was the brother of Moses?", ["Abraham", "Isaac", "Jacob", "Aaron"], "Aaron", "Characters", "multiple_choice", "easy", "Exodus 4", "He was Israel's first high priest."),
    ("What sea did the Israelites cross on dry land?", ["Dead Sea", "Mediterranean Sea", "Red Sea", "Sea of Galilee"], "Red Sea", "Miracles", "multiple_choice", "easy", "Exodus 14", "Moses stretched out his hand over it."),
    ("Who recognized Jesus as the Messiah while He was a baby in the temple?", ["Simeon", "Zechariah", "Nicodemus", "Joseph"], "Simeon", "New Testament", "multiple_choice", "hard", "Luke 2", "He had been promised he wouldn't die before seeing the Christ."),
    ("What kind of wood was Noah's ark made from?", ["Cedar", "Gopher", "Acacia", "Oak"], "Gopher", "Old Testament", "multiple_choice", "hard", "Genesis 6:14", "A specific type of wood mentioned only once."),
    ("I am the bread of _, whoever comes to me will never go hungry.", [], "life", "Fill in the Blanks", "fill_blank", "medium", "John 6:35", "Opposite of death."),
    ("John the Baptist wore clothes made of camel's hair.", ["True", "False"], "True", "True or False", "true_false", "medium", "Matthew 3:4", "He also ate locusts and wild honey.")
]

try:
    with open('questions.json', 'r', encoding='utf-8') as f:
        existing = json.load(f)
except:
    existing = []

for q, o, a, c, t, d, r, h in questions_data:
    existing.append({
        "question": q,
        "options": o,
        "answer": a,
        "category": c,
        "type": t,
        "difficulty": d,
        "reference": r,
        "hint": h
    })

with open('questions.json', 'w', encoding='utf-8') as f:
    json.dump(existing, f, indent=2)

print(f"Added {len(questions_data)} new highly diverse questions.")
