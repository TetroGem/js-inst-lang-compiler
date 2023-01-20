# Unnamed language thing

## Operator Types
> **Set-Type**\
> Return Size: The number of bytes to overwrite in memory after the address\
> Flags:
> - None: Store value in memory as an integer
> - f: Store value in memory as a float

> **Out-Type**\
> Return Size: ~~*Ignored*~~\
> Flags: ~~*Ignored*~~

> **String-Type**\
> Return Size: The number of bytes each character will take up in memory\
> Flags:
> - None: Store value in memory as an integer
> - f: Store value in memory as a float

> **Jump-Type**\
> Return Size: ~~*Ignored*~~\
> Flags: ~~*Ignored*~~

> **End-Type**\
> Return Size: ~~*Ignored*~~\
> Flags: ~~*Ignored*~~

## Operators
### Control
> **set** (Set)\
> *Set-Type*\
> Address: Address to set the value of\
> Current: ~~*Ignored*~~\
> Value: Value to set to the address

> **inp** (Input)\
> *Set-Type*\
> Address: Address to store the input to\
> Current: ~~*Ignored*~~\
> Value: Form to apply to the input\

> **out** (Output)\
> *Out-Type*\
> Address: Address to get the value to output from\
> Current: Value to be outputted\
> Value: Form to apply to the output

> **rds** (Read String)\
> *String-Type*\
> Address: Address to start storing the string at\
> Current: ~~*Ignored*~~\
> Value: Maximum length in characters of the string input (Characters exceeding the max will be discarded)

> **jmp** (Jump)\
> *Jump-Type*\
> Address: ~~*Ignored*~~\
> Current: ~~*Ignored*~~\
> Value: The program counter to jump to (in bytes)

> **jif** (Jump If)\
> *Jump-Type*\
> Address: The address of the condition\
> Current: The condition to check, will jump if present (not 0)\
> Value: The program counter to jump to (in bytes)

> **jni** (Jump Not If)\
> *Jump-Type*\
> Address: The address of the condition\
> Current: The condition to check, will jump if not present (equal to 0 / null byte)\
> Value: The program counter to jump to (in bytes)

> **end** (End)\
> *End-Type*\
> (Ends the program when executed)\
> Address: ~~*Ignored*~~\
> Current: ~~*Ignored*~~\
> Value: ~~*Ignored*~~

### Arithmetic
> **add** (Add)\
> *Set-Type*\
> Address: Address to store the sum to\
> Current: The augend, first number in addition expression\
> Value: The addend, second number in addition expression

### Logic
> **and** (And)\
> *Set-Type*\
> Address: Address to store the bitwise AND result of the two operands to\
> Current: The first operand\
> Value: The second operand