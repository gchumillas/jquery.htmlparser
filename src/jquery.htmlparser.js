/**
 * This plugin is used to parse and transform an HTML/XML document to a new one. It can also be used
 * to fix a bad-formed HTML/XML document.
 * 
 * This code was originally designed by Erik Arvidsson:
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 * 
 * and then changed by John Resig:
 * http://ejohn.org/files/htmlparser.js
 * 
 * and then changed by Sam Blowes:
 * https://github.com/soloproyectos/jquery.htmlparser/blob/master/htmlparser.js
 * 
 * and then changed by me to work as a jQuery plugin:
 * https://github.com/soloproyectos/jquery.htmlparser
 * 
 * ### Examples of use:
 * 
 * // Example 1: fixes a bad-formed HTML document
 * $html = $.htmlParser('<p>Bad formed<br> html document');
 * 
 * // Example 2: parses an HTML document
 * var html =
 *         '<p>Actually <strong>we do not exist</strong>.<br />' +
 *         'But before we can prove it, <em>we will have already disappeared.</em></p>';
 * $.htmlParser(html, {
 *         start: function () {
 *             // 'this' is a jQuery object representing the current node
 *             console.log('Start tag: <' + this.prop('tagName') + '>');
 *         },
 *         end: function () {
 *             console.log('End tag: </' + this.prop('tagName') + '>');
 *         },
 *         text: function () {
 *             console.log('Text: ' + this.text());
 *         },
 *         comment: function (text) {
 *             console.log('Comment: ' + this.text());
 *         }
 * });
 * 
 * // Example 3: transform a HTML document to another one
 * // This examples replaces the following CSS properties:
 * //     1. 'font-weight: bold' is replaced by '<strong>'
 * //     2. 'font-style: italic' is replaced by '<em>'
 * //     3. 'text-decoration: underline' is replaced by '<u>'
 * var html =
 *     'The quick <span style="font-weight: bold; ">brown</span> fox jumps over the ' +
 *     '<span style="font-style: italic; ">lazy dog</span> and feels as if ' +
 *     '<span style="text-decoration: underline; font-weight: bold; ">he were in the </span> ' +
 *     'seventh <span style="font-weight: bold; font-style: italic; ">heaven of</span> ' +
 *     'typography together with Hermann Zapf, the most famous artist of the...';
 * var str = $.htmlParser(html, function () {
 *     var ret = this;
 *     var replacements = [
 *         {style: 'font-weight', value: 'bold', entity: 'strong'},
 *         {style: 'font-style', value: 'italic', entity: 'em'},
 *         {style: 'text-decoration', value: 'underline', entity: 'u'}
 *     ];
 *     
 *     // 'this' is an object representing the current node
 *     if (this.prop('tagName') == 'SPAN') {
 *         var target = this;
 *         
 *         $.each(replacements, function () {
 *             if (target.css(this.style) == this.value) {
 *                 // wraps the result around the corresponding entity
 *                 ret = $('<' + this.entity + ' />').append(ret);
 *                 
 *                 // removes the css style
 *                 target.css(this.style, '');
 *                 
 *                 // removes the 'span' node if it doesn't have any attribute
 *                 if (target[0].attributes.length == 0) {
 *                     target.replaceWith(target.contents());
 *                 }
 *             }
 *         });
 *     }
 *     
 *     return ret;
 * });
 * console.log(str);
 * 
 * This code was originally designed by Erik Arvidsson:
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 * 
 * and then changed by John Resig:
 * http://ejohn.org/files/htmlparser.js
 * 
 * and then changed by Sam Blowes:
 * https://github.com/blowsie/Pure-JavaScript-HTML5-Parser
 * 
 * and then changed by me to work as a jQuery plugin:
 * https://github.com/soloproyectos/jquery.htmlparser
 * 
 * @author    Gonzalo Chumillas <gchumillas@email.com>
 * @license   http://www.apache.org/licenses/LICENSE-2.0.html Apache Software License 2.0
 * @link      https://github.com/soloproyectos/jquery.htmlparser
 */
(function ($) {

    // Regular Expressions for parsing tags and attributes
    var startTag = /^<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
        endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/,
        attr = /([a-zA-Z_:][-a-zA-Z0-9_:.]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

    // Empty Elements - HTML 5
    var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed");

    // Block Elements - HTML 5
    var block = makeMap("address,article,applet,aside,audio,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,footer,form,frameset,h1,h2,h3,h4,h5,h6,header,hgroup,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video");

    // Inline Elements - HTML 5
    var inline = makeMap("a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

    // Elements that you can, intentionally, leave open
    // (and which close themselves)
    var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

    // Attributes that have their values filled in disabled="disabled"
    var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

    // Special Elements (can contain anything)
    var special = makeMap("script,style");

    /**
     * This class parses an HTML/XML document.
     * 
     * @param {String} html    HTML/XML document
     * @param {Object} handler Plain object
     * 
     * @return {HTMLParser}
     */
    var HTMLParser = function (html, handler) {
        var index, chars, match, stack = [], last = html;
        stack.last = function () {
            return this[this.length - 1];
        };

        while (html) {
            chars = true;

            // Make sure we're not in a script or style element
            if (!stack.last() || !special[stack.last()]) {

                // Comment
                if (html.indexOf("<!--") == 0) {
                    index = html.indexOf("-->");

                    if (index >= 0) {
                        if (handler.comment)
                            handler.comment(html.substring(4, index));
                        html = html.substring(index + 3);
                        chars = false;
                    }

                    // end tag
                } else if (html.indexOf("</") == 0) {
                    match = html.match(endTag);

                    if (match) {
                        html = html.substring(match[0].length);
                        match[0].replace(endTag, parseEndTag);
                        chars = false;
                    }

                    // start tag
                } else if (html.indexOf("<") == 0) {
                    match = html.match(startTag);

                    if (match) {
                        html = html.substring(match[0].length);
                        match[0].replace(startTag, parseStartTag);
                        chars = false;
                    }
                }

                if (chars) {
                    index = html.indexOf("<");

                    var text = index < 0 ? html : html.substring(0, index);
                    html = index < 0 ? "" : html.substring(index);

                    if (handler.chars)
                        handler.chars(text);
                }

            } else {
                html = html.replace(new RegExp("([\\s\\S]*?)<\/" + stack.last() + "[^>]*>"), function (all, text) {
                    text = text.replace(/<!--([\s\S]*?)-->|<!\[CDATA\[([\s\S]*?)]]>/g, "$1$2");
                    if (handler.chars)
                        handler.chars(text);

                    return "";
                });

                parseEndTag("", stack.last());
            }

            if (html == last)
                throw "Parse Error: " + html;
            last = html;
        }

        // Clean up any remaining tags
        parseEndTag();

        function parseStartTag(tag, tagName, rest, unary) {
            tagName = tagName.toLowerCase();

            if (block[tagName]) {
                while (stack.last() && inline[stack.last()]) {
                    parseEndTag("", stack.last());
                }
            }

            if (closeSelf[tagName] && stack.last() == tagName) {
                parseEndTag("", tagName);
            }

            unary = empty[tagName] || !!unary;

            if (!unary)
                stack.push(tagName);

            if (handler.start) {
                var attrs = [];

                rest.replace(attr, function (match, name) {
                    var value = arguments[2] ? arguments[2] :
                        arguments[3] ? arguments[3] :
                        arguments[4] ? arguments[4] :
                        fillAttrs[name] ? name : "";

                    attrs.push({
                        name: name,
                        value: value,
                        escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"
                    });
                });

                if (handler.start)
                    handler.start(tagName, attrs, unary);
            }
        }

        function parseEndTag(tag, tagName) {
            // If no tag name is provided, clean shop
            if (!tagName)
                var pos = 0;

                // Find the closest opened tag of the same type
            else
                for (var pos = stack.length - 1; pos >= 0; pos--)
                    if (stack[pos] == tagName)
                        break;

            if (pos >= 0) {
                // Close all the open elements, up the stack
                for (var i = stack.length - 1; i >= pos; i--)
                    if (handler.end)
                        handler.end(stack[i]);

                // Remove the open elements from the stack
                stack.length = pos;
            }
        }
    };
    
    function makeMap(str) {
        var obj = {}, items = str.split(",");
        for (var i = 0; i < items.length; i++)
            obj[items[i]] = true;
        return obj;
    }
    
    /**
     * Transforms a bad-formed HTML/XML document to a well-formed document.
     * 
     * @param {String} html HTML/XML document
     * 
     * @return {String}
     */
    var html2xml = function (html) {
        var results = "";

        HTMLParser(html, {
            start: function (tag, attrs, unary) {
                results += "<" + tag;

                for (var i = 0; i < attrs.length; i++)
                    results += " " + attrs[i].name + '="' + attrs[i].escaped + '"';
                results += unary? " />" : ">";
            },
            end: function (tag) {
                results += "</" + tag + ">";
            },
            chars: function (text) {
                results += text;
            },
            comment: function (text) {
                results += "<!--" + text + "-->";
            }
        });

        return results;
    };
    
    /**
     * This plugin parses an HTML/XML document.
     * 
     * @param {String}          html HTML/XML document
     * @param {Object|Function} handler Handler (not required)
     * 
     * @return {String}
     */
    $.htmlParser = function (html, handler) {
        var nodes = [$('<div />')];
        
        // executes a handler
        function exec(handler, node) {
            var item = $.proxy(handler, node)();
            return item !== undefined? item : node;
        }
        
        // adds a node to nodes
        function pushNode(tagName, attrs, handler) {
            var node = $('<' + tagName + '/>');
            
            // appends attributes
            $.each(attrs, function () {
                node.attr(this.name, this.value);
            });
            
            nodes.push(handler !== undefined? exec(handler, node) : node);
        }
        
        // removes the last node from nodes
        function popNode(handler) {
            var node = nodes.pop();
            var parentNode = nodes[nodes.length - 1];
            
            parentNode.append(handler !== undefined? exec(handler, node) : node);
        }
        
        // appends a text node to the last element of nodes
        function appendText(text, handler) {
            var node = $(document.createTextNode(text));
            var parentNode = nodes[nodes.length - 1];
            
            parentNode.append(handler !== undefined? exec(handler, node) : node);
        }
        
        // appends a comment node to the last element of nodes
        function appendComment(text, handler) {
            var node = $(document.createComment(text));
            var parentNode = nodes[nodes.length - 1];                
            
            parentNode.append(handler !== undefined? exec(handler, node) : node);
        }
        
        if ($.isPlainObject(handler)) {
            new HTMLParser(html, {
                start: function (tagName, attrs, unary) {
                    pushNode(tagName, attrs, handler.start);
                    
                    if (unary) {
                        popNode(handler.end);
                    }
                },
                end: function (tagName) {
                    popNode(handler.end);
                },
                chars: function (text) {
                    appendText(text, handler.text);
                },
                comment: function (text) {
                    appendComment(text, handler.comment);
                }
            });
        } else
        if ($.type(handler) == 'function') {
            new HTMLParser(html, {
                start: function (tagName, attrs, unary) {
                    pushNode(tagName, attrs);
                    
                    if (unary) {
                        popNode(handler);
                    }
                },
                end: function (tagName) {
                    popNode(handler);
                },
                chars: function (text) {
                    appendText(text, handler);
                },
                comment: function (text) {
                    appendComment(text, handler);
                }
            });
        } else {
            return html2xml(html);
        }
        
        return nodes.pop().html();
    };
})(jQuery);
