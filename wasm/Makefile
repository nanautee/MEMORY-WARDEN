CC = emcc
CFLAGS = -O2 -s WASM=1 -s EXPORTED_FUNCTIONS='["_mem_alloc","_mem_free","_mem_defragment","_mem_scan_leaks","_mem_get_block_count","_mem_get_block","_mem_get_used","_mem_get_total","_mem_reset","_mem_sort_by_size","_mem_inject_leak"]' -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' -s MODULARIZE=1 -s ALLOW_MEMORY_GROWTH=1

TARGET = ../public/wasm/memory_warden

all: $(TARGET).js

$(TARGET).js: memory_manager.c
	$(CC) $< -o $(TARGET).js $(CFLAGS)

clean:
	rm -f $(TARGET).js $(TARGET).wasm

.PHONY: all clean
