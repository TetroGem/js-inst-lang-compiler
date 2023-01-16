const code = `

inp 6 0

add 0 16u1
add 2 16u1

out 0 2
out 2 2

jni 8$6 16
add 4 16$0
add 4 16$2

out 4 2

clr 0 2
add 0 16$2
clr 2 2
add 2 16$4
clr 4 2

sub 6 8u1
jmp 0 5


end 0 0

`;