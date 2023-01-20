export const opCodes = {
    set: 0,
    inp: 1,
    out: 2,
    rds: 3,
    jmp: 4,
    jif: 5,
    jni: 6,
    end: 7,

    add: 8,
    sub: 9,
    mul: 10,
    div: 11,
    mod: 12,

    and: 13,
    ior: 14,
    xor: 15,
    not: 16,
    sls: 17,
    srs: 18,
    sru: 19,
} as const;