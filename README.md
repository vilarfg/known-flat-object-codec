# known-flat-object-codec

Codec creator for flat objects with all properties and possible values known in advance.

Let's say you deal with objects:

- that are flat (values are not objects),  
  like this:
  ```javascript
  { answer: 42 }
  ```
  not like this:
  ```javascript
  { question: { answer: 42 } }
  ```
- for which all (meaningful<sup>[[1]](#note-meaningful)</sup>) properties are known
- and all possible values for said properties are known.  
  like this:
  ```typescript
  { answer: 42 | '42' | 'forty two'; }
  ```
  not like this:
  ```typescript
  { answer: number | string; }
  ```

Let's say you need to:

- send these objects through the wire
- or use them as keys in memoization.

If this is the case, `known-flat-object-codec`, given a configuration, will produce a codec for objects that fit this criteria. The focus is on space saving.

<span id="note-meaningful">[1]: meaningful means properties that must not be dropped during encoding.</span>

## Installation

```bash
npm install known-flat-object-codec
```

## Usage

```javascript
import getKFOC from 'known-flat-object-codec';

const { decode, encode } = getKFOC({
    currency: ['EUR', 'THB', 'USD'],
    notation: ['standard', 'scientific', 'engineering', 'compact'],
    numberingSystem: ['latn', 'thai'],
});

const obj = {
  currency: 'THB',
  numberingSystem: 'thai',
  will_be_dropped: true,
};

const encoded = encode(obj);
console.log(encoded);
// → '76'
// as JSON it would be: "76" (4 bytes)

const decoded = decode(encoded);
console.log(decoded);
// → { currency: 'THB', numberingSystem: 'thai' }
// as JSON it would be: {"currency":"THB","numberingSystem":"thai"} (43 bytes)
```

4 / 43 = 0.093 😉

## License

[MIT](./LICENSE) © 2022 Fernando G. Vilar.
