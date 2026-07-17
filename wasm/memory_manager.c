#include <stdlib.h>
#include <string.h>
#include <stdio.h>

#define MAX_BLOCKS 256
#define MEMORY_SIZE 4096

typedef struct {
    int id;
    int address;
    int size;
    int is_free;
    int is_leak;
} Block;

static Block blocks[MAX_BLOCKS];
static int block_count = 0;
static int total_memory = MEMORY_SIZE;
static int used_memory = 0;
static int next_address = 0;

static int find_free_block(int size) {
    int best_addr = -1;
    int best_size = MEMORY_SIZE + 1;
    for (int i = 0; i < block_count; i++) {
        if (blocks[i].is_free && blocks[i].size >= size) {
            if (blocks[i].size < best_size) {
                best_size = blocks[i].size;
                best_addr = i;
            }
        }
    }
    return best_addr;
}

int mem_alloc(int size) {
    if (size <= 0 || used_memory + size > total_memory) return -1;

    int idx = find_free_block(size);
    if (idx != -1) {
        Block *b = &blocks[idx];
        if (b->size > size) {
            if (block_count >= MAX_BLOCKS) return -1;
            blocks[block_count] = (Block){
                .id = block_count,
                .address = b->address + size,
                .size = b->size - size,
                .is_free = 1,
                .is_leak = 0
            };
            block_count++;
        }
        b->size = size;
        b->is_free = 0;
        b->is_leak = 0;
        used_memory += size;
        return b->id;
    }

    if (block_count >= MAX_BLOCKS) return -1;

    blocks[block_count] = (Block){
        .id = block_count,
        .address = next_address,
        .size = size,
        .is_free = 0,
        .is_leak = 0
    };
    next_address += size;
    used_memory += size;
    block_count++;
    return block_count - 1;
}

int mem_free(int id) {
    if (id < 0 || id >= block_count) return -1;
    if (blocks[id].is_free) return -1;
    blocks[id].is_free = 1;
    used_memory -= blocks[id].size;
    return 0;
}

int mem_defragment() {
    int merged = 0;
    for (int i = 0; i < block_count - 1; i++) {
        if (blocks[i].is_free && blocks[i + 1].is_free) {
            blocks[i].size += blocks[i + 1].size;
            for (int j = i + 1; j < block_count - 1; j++) {
                blocks[j] = blocks[j + 1];
            }
            block_count--;
            merged++;
            i--;
        }
    }
    return merged;
}

int mem_scan_leaks() {
    int leaks = 0;
    for (int i = 0; i < block_count; i++) {
        if (blocks[i].is_leak) leaks++;
    }
    return leaks;
}

void mem_inject_leak(int id) {
    if (id >= 0 && id < block_count) {
        blocks[id].is_leak = 1;
    }
}

int mem_get_block_count() { return block_count; }

void mem_get_block(int id, int *out) {
    if (id >= 0 && id < block_count) {
        Block b = blocks[id];
        out[0] = b.id;
        out[1] = b.address;
        out[2] = b.size;
        out[3] = b.is_free;
        out[4] = b.is_leak;
    }
}

int mem_get_used() { return used_memory; }
int mem_get_total() { return total_memory; }

void mem_reset() {
    block_count = 0;
    used_memory = 0;
    next_address = 0;
}

void mem_sort_by_size() {
    for (int i = 0; i < block_count - 1; i++) {
        for (int j = 0; j < block_count - i - 1; j++) {
            if (blocks[j].size > blocks[j + 1].size) {
                Block tmp = blocks[j];
                blocks[j] = blocks[j + 1];
                blocks[j + 1] = tmp;
            }
        }
    }
    for (int i = 0; i < block_count; i++) {
        blocks[i].id = i;
    }
}
