jQuery.htmlParser plugin
========================


This plugin can parse, clean or transform an HTML/XML document.

This code was originally written by Erik Arvidsson:  
http://erik.eae.net/simplehtmlparser/simplehtmlparser.js  
and then changed by John Resig:  
http://ejohn.org/files/htmlparser.js  
and then changed by Sam Blowes:  
https://github.com/blowsie/Pure-JavaScript-HTML5-Parser  
and then changed by me.

### Installation
Download the jquery.htmlparser.js file in your project.

### Examples

#### Examples 1: Clean a bad-formed HTML/XML document

```JavaScript
// Example 1: fixes a bad-formed HTML document
$html = $.htmlParser('<p>Bad formed<br> html document');
```
    
#### Example 2: Parse an HTML/XML document

```JavaScript
// Example 2: parses an HTML document
var html =
    '<p>Actually <strong>we do not exist</strong>.<br />' +
    'But before we can prove it, <em>we will have already disappeared.</em></p>';
$.htmlParser(html, {
        start: function () {
            // 'this' is a jQuery object representing the current node
            console.log('Start tag: <' + this.prop('tagName') + '>');
        },
        end: function () {
            console.log('End tag: </' + this.prop('tagName') + '>');
        },
        text: function () {
            console.log('Text: ' + this.text());
        },
        comment: function (text) {
            console.log('Comment: ' + this.text());
        }
});
```
    

#### Example 3: Transform an HTML/XML document to a new one

```JavaScript
// Example 3: transforms an HTML document to another one
// This example replaces the following CSS properties:
//     1. 'font-weight: bold' is replaced by '<strong>'
//     2. 'font-style: italic' is replaced by '<em>'
//     3. 'text-decoration: underline' is replaced by '<u>'
var html =
    'The quick <span style="font-weight: bold; ">brown</span> fox jumps over the ' +
    '<span style="font-style: italic; ">lazy dog</span> and feels as if ' +
    '<span style="text-decoration: underline; font-weight: bold; ">he were in the </span> ' +
    'seventh <span style="font-weight: bold; font-style: italic; ">heaven of</span> ' +
    'typography together with Hermann Zapf, the most famous artist of the...';
var str = $.htmlParser(html, function () {
    var ret = this;
    var replacements = [
        {style: 'font-weight', value: 'bold', entity: 'strong'},
        {style: 'font-style', value: 'italic', entity: 'em'},
        {style: 'text-decoration', value: 'underline', entity: 'u'}
    ];
    
    // 'this' is an object representing the current node
    if (this.prop('tagName') == 'SPAN') {
        var target = this;
        
        $.each(replacements, function () {
            if (target.css(this.style) == this.value) {
                // wraps the result around the corresponding entity
                ret = $('<' + this.entity + ' />').append(ret);
                
                // removes the css style
                target.css(this.style, '');
                
                // removes the 'span' node if it doesn't have any attribute
                if (target[0].attributes.length == 0) {
                    target.replaceWith(target.contents());
                }
            }
        });
    }
    
    return ret;
});
console.log(str);
```
