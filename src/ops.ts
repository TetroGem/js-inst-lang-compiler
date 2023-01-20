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

/*
0: set,
    1: inp,
    2: out,
    3: rds,
    4: jmp,
    5: jif,
    6: jni,
    7: end,

    8: add,
    9: sub,
    10: mul,
    11: div,
    12: mod,

    13: and,
    14: ior,
    15: xor,
    16: not,
    17: sls,
    18: srs,
    19: sru,*/