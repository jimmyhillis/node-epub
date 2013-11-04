# node-epub

Generate valid ePub documents from your own electronic book assets with node.

## Example

```
var epub = require('node-epub');

// Generate basic ePub object with metadata
book = new epub.Epub({
    title: 'The Greatest Book Ever Written',
    author: 'Joe Blogs',
    lang: 'en-us',
});

// Add your chapter files
book.addFile('chapter-1.xhtml', {
    name: 'chapter-1.xhtml',
    title: 'Part 1: The way the story begins'
});
book.addFile('chapter-2.xhtml', {
    name: 'chapter-2.xhtml',
    title: 'Part 2: To the finish, quickly my dear'
});

// Output your ePub
book.generate('book.epub');
```

Early days with lots of bugs. Able to generate a valid ePub which can be read in iBooks and passes ePub validation at http://validator.idpf.org/.
