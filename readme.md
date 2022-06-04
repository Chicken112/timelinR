# TimelinR

My simple timeline implementation <br/>
You can vew a working demo here: [https://chicken112.github.io/timelinR/index.html](https://chicken112.github.io/timelinR/index.html)

### Features
- Editable text
- Supports ranges and points
- Movable / resizable elements

### Configuration
```js
const time = new TimelineR(<Element>, [
    {from: <Number>, ?to: <Number>, ?text: <String>},
    ...
    {from: <Number>, ?to: <Number>, ?text: <String>},
], {
    ?start: <Number>,
    ?zoom: <Number>,
    ?maxZoom: <Number>,
    ?minZoom: <Number>,
    ?minOffset: <Number>,
    ?maxOffset: <Number>,
    ?labelText: < Function(<Number>) : <String> >
});

```