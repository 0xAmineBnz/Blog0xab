---
title: "Reversing a packed ELF dropper with radare2"
slug: reversing-a-packed-elf-dropper-with-radare2
excerpt: "A walk through statically and dynamically unpacking a small Linux dropper: finding the unpacking stub, dumping the decrypted stage, and reconstructing its behaviour."
category: application-security
tags: [radare2, elf, unpacking]
published: true
publishedAt: 2026-08-12
---

<h2>First contact</h2><p>The sample is a 32KB statically-linked ELF with almost no readable strings — a strong sign it is packed. <code>radare2</code> is enough to take it apart without ever running the malicious stage.</p><pre><code class="language-bash">$ file dropper
dropper: ELF 64-bit LSB executable, x86-64, statically linked, stripped
$ rabin2 -z dropper | head     # almost nothing
$ r2 -AA dropper</code></pre><h3>Finding the unpacking stub</h3><p>Entropy is high and <code>entry0</code> jumps straight into a tight loop that writes back into an RWX segment — the decryptor.</p><pre><code class="language-asm">; entry0
mov   rsi, qword [rip + 0x2f10]   ; encrypted blob
mov   rcx, 0x1a00                 ; length
xor   rdx, rdx
.loop:
xor   byte [rsi + rdx], 0x5a      ; single-byte XOR
inc   rdx
cmp   rdx, rcx
jne   .loop
jmp   rsi                         ; transfer to decrypted stage</code></pre><h2>Dumping the decrypted stage</h2><p>Rather than emulate, set a breakpoint on the final <code>jmp rsi</code> and dump the now-decrypted region from the debugger.</p><pre><code class="language-bash"># in r2, debug mode
$ r2 -d dropper
> db 0x00401037      # the jmp rsi
> dc
> wtf stage.bin 0x1a00 @ rsi   # write-to-file the decrypted blob</code></pre><blockquote>Single-byte XOR with key <code>0x5a</code> is lazy, but it is still the most common packer you will meet in commodity Linux malware.</blockquote><h2>What the stage actually does</h2><ul><li>Resolves <code>execve</code>/<code>socket</code> by syscall number — no imports.</li><li>Connects back to a hard-coded C2 on TCP/4444.</li><li>Drops a persistence unit under <code>~/.config/systemd/user</code>.</li></ul><p>From here the decrypted <code>stage.bin</code> can be loaded into the decompiler as raw shellcode at its known base, and the rest is straightforward static analysis.</p>
