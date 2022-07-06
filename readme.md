# TimelinR
My simple timeline implementation <br/>
You can vew a working demo here: [https://chicken112.github.io/timelinR/index.html](https://chicken112.github.io/timelinR/index.html)

# Features
```diff
! This timeline is single-lined. If two points get too close, they will  just simply overlap. !
```
- Editable text
- Supports ranges and points
- Movable / resizable elements

# Usage
```js
const timeline = new TimelinR(element, data, options);
```
### Data
```js
{
    from: number,
    to: optional number,
    text: string
}
```

### Options
an object with the following optional properties
| name                 | type                       | default           | description                                                                                                              |
|----------------------|----------------------------|-------------------|--------------------------------------------------------------------------------------------------------------------------|
| start                | number                     | 0                 | Where should the timeline start                                                                                          |
| zoom                 | number                     | 1                 | How much segments should be visible at any moment (It is a bit counterintuitive, because bigger value means less "zoom") |
| minZoom              | number                     | 60                | The minimum amount of zoom                                                                                               |
| maxZoom              | number                     | 1                 | The maximum amount of zoom                                                                                               |
| minOffset            | number                     | 0                 | Should not be changed, change start instead                                                                              |
| maxOffset            | number                     | 60                | The maximum amount of offset                                                                                             |
| showCurrentTime      | boolean                    | true              | Whether to show the red line                                                                                             |
| canModify            | boolean                    | true              | Wether the user can move, resize and rename data points                                                                  |
| backgroundCollapseAt | number                     | 20                | When zooming out, this is the zoom threshold to hit to collapse the segments                                             |
| backgroundCollapse   | number                     | 10                | When collapsing the background, this is the new interval for segments                                                    |
| labelText            | function(number) :string   | (i) => i          | What to display at each segment                                                                                          |
| onZoomChanged        | function(number):number    | (zoom)=>zoom      | allows you to hijack the zoom process                                                                                    |
| onOffsetChanged      | function(number):number    | (offfset)=>offset | allows you to hijack the panning process                                                                                 |
| onDataChanged        | callback(array[data]):void | (data)=>{}        | A callback for when data was moved, resized or renamed                                                                   |