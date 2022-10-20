type Value = boolean | number | string | null;

type Schema = Record<string, ReadonlyArray<Value>>;

type SchemaConformant<S extends Schema> = {
  [k in keyof S]?: S[k][number];
};

/** Schema conformant codec. */
interface Codec<S extends Schema> {
  /**
   * Decodes the provided string into a schema conformant object.
   * @param s String to be decoded.
   */
  decode: (s: string) => SchemaConformant<S>;
  /**
   * Encodes the provided schema conformant object into a string.
   * @param obj Object to be encoded.
   */
  encode: (obj: Record<string, unknown>) => string;
}

const emptySchemaEncoder = () => '';
const emptySchemaDecoder = () => ({});

/**
 * Creates a codec using the provided schema.
 * @param schema Schema for the codec.
 */
const getCodec = <S extends Schema>(schema: S) => {
  const encoding: Record<string, Record<string, [number, number]>> = Object.create(null);
  const decoding: Array<Array<[string, Value]>> = [];
  let pos = -1;
  let count = 0;
  let decodingChunk: Array<[string, Value]> = [];

  for (const [prop, opts] of Object.entries(schema).sort(([a], [b]) =>
    a < b ? -1 : 1
  )) {
    const options = [...new Set(opts)].sort();

    const localValues: Record<string, [number, number]> = Object.create(null);
    for (const option of options) {
      const offset = count % 31;
      if (offset === 0) {
        pos++;
        decodingChunk = [];
        decoding.push(decodingChunk);
      }
      localValues[option as string] = [pos, 1 << offset];
      decodingChunk[offset] = [prop, option];
      count++;
    }
    encoding[prop] = localValues;
  }

  const { length } = decoding;

  return (
    length
      ? {
          decode: (s) => {
            const target: Record<string, Value> = {};
            const chunks = s.split('_');

            for (let chunkIndex = 0; chunkIndex < length; chunkIndex++) {
              const chunk = decoding[chunkIndex];
              const chunkString = chunks[chunkIndex];
              const n = chunkString ? parseInt(chunkString, 36) : 0;

              if (n)
                for (let { length } = chunk; length--; )
                  if (n & (1 << length)) {
                    const [prop, value] = chunk[length];
                    target[prop] = value;
                  }
            }
            return target;
          },
          encode: (obj) => {
            const target = new Array<number>(length).fill(0);

            for (const k in obj) {
              const value = encoding[k];

              if (value && Object.prototype.hasOwnProperty.call(obj, k)) {
                const found = value[obj[k] as string];
                if (found) target[found[0]] |= found[1];
              }
            }

            return target.reduce(
              (s, n, i) => `${s}${i === 0 ? '' : '_'}${n ? n.toString(36) : ''}`,
              ''
            );
          },
        }
      : { decode: emptySchemaDecoder, encode: emptySchemaEncoder }
  ) as Codec<S>;
};

export { getCodec as default };
