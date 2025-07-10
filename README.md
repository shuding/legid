# legitid

A library for generating and validating __safe__ and random ID strings.

- Safe to use on the client side
- No nounce or shared secret necessary between client and server

## Usage

```typescript
import { createId, verifyId } from 'legitid'

// Client Side
const id = await createId() // 'UoVSeKNGsqxuDE'

// Server Side
const isValid = await verifyId(id)
```

## Why is this safe?

The generated ID consists of a hex-encoded random data buffer with its SHA-1 hash
(with a configurable salt). These 2 parts are mixed together and encoded in the
base62 alphabet.

## Author

Shu Ding.

## License

The MIT License.
