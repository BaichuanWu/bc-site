# Fix WQB Knowledge route decoding

## Why

Opening an encoded knowledge version link passes an encoded route parameter to
the detail page. Encoding it again for the API produces a different identity and
a false Knowledge not found response, even though the record is readable.

## What Changes

Decode the detail route segment once before normalizing legacy numeric references
and constructing the API request. Use the decoded segment to construct the
canonical workspace tab path. Keep malformed percent input from crashing rendering.

## Impact

bc-site only. Existing opaque identity/version links and legacy numeric links
remain supported. Backend contracts, knowledge identities and persistence are
unchanged; no migration is required.
