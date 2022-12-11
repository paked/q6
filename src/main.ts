import './style.css'

interface Point {
    row: number;
    col: number;
}

interface Selection {
    start: Point;
    end: Point;
}

function selectionShouldNormalize(sel: Selection): boolean {
    if (sel.end.row < sel.start.row) {
        return true;
    }
    
    if (sel.end.col < sel.start.col) {
        return true;
    }

    return false;
}

function selectionNormalize(sel: Selection): Selection {
    if (selectionShouldNormalize(sel)) {
        return {
            start: sel.end,
            end: sel.start,
        }
    }

    return sel;
}

function indexToPoint(lines: string[], index: number): Point {
    let col = index;
    let row = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (col < line.length + 1) {
            break;
        }

        col -= line.length + 1;

        row += 1;
    }

    return {
        row, col
    }
}

function pointToIndex(lines: string[], point: Point): number {
    let index = 0;

    for (let i = 0; i < lines.length; i++) {
        if (i != point.row) {
            index += lines[i].length + 1;

            continue
        }

        break;
    }

    index += point.col;

    return index;
}

function getLineNum(elem: HTMLElement): number | undefined {
    if (elem.hasAttribute('data-linenum')) {
        return parseInt(elem.getAttribute('data-linenum')!);
    }

    if (!elem.parentElement) {
        return;
    }

    return getLineNum(elem.parentElement)
}

const display = document.querySelector<HTMLDivElement>('#display')!;
const editor = document.querySelector<HTMLTextAreaElement>('#editor')!;
const measure = document.querySelector<HTMLSpanElement>('#measure')!;
const cursor = document.querySelector<HTMLSpanElement>('#cursor')!;

let ourSelection: Selection = {
    start: {
        row: 0,
        col: 0,
    },
    end: {
        row: 0,
        col: 0,
    }
};

function handleSelectionChanged() {
    const lines = editor.value.split('\n');

    ourSelection.start = indexToPoint(lines, editor.selectionStart);
    ourSelection.end = indexToPoint(lines, editor.selectionEnd);

    ourSelection = selectionNormalize(ourSelection);

    window.redrawTextArea()
}

display.addEventListener('click', () => {
    editor.focus();
})

display.addEventListener('mouseup', (_: MouseEvent) => {
    let selection = document.getSelection();

    ourSelection = {
        start: {
            row: getLineNum(document.getSelection()?.anchorNode?.parentElement!)!,
            col: selection?.anchorOffset!,
        },
        end: {
            row: getLineNum(document.getSelection()?.focusNode?.parentElement!)!,
            col: selection?.focusOffset!,
        }
    }

    ourSelection = selectionNormalize(ourSelection);

    const lines = editor.value.split('\n');

    editor.selectionStart = pointToIndex(lines, ourSelection.start);
    editor.selectionEnd = pointToIndex(lines, ourSelection.end);
});

window.redrawTextArea = function() {
    // TODO(harrison): we should store this somewhere global whenever an editor changes, then it doesn't have to be pulled ever redraw.
    const lines = editor.value.split('\n');

    let start = ourSelection.start;
    let end = ourSelection.end;

    // NOTE(harrison): move cursor out of code area so we can refresh that.
    document.body.appendChild(cursor);

    display.innerHTML = lines
        .map((line, i) => {
            // TODO(harrison): handle partially highlighted rows
            let highlighted = false;
            if ((start.row !== end.row || start.col !== end.col) && (i >= start.row && i <= end.row)) {
                highlighted = true;
            }

            if (line.length === 0) {
                line = "&nbsp;"
            }
            
            const highlightedClass = highlighted ? 'highlighted' : '';

            return `<span class="${highlightedClass}"><pre>${line}</pre></span>`;
        })
        .map((line, i) => {
            return `<div class="line" data-linenum="${i}">${line}</div>`;
        })
        .join('\n');

    let focusRow = display.children[start.row] as HTMLElement;
    // NOTE(harrison): move cursor to current line
    focusRow.prepend(cursor);

    measure.innerText = 'q'.repeat(start.col);
    let xoffset = measure.getBoundingClientRect().width;
    cursor.style.transform = `translateX(${xoffset}px)`;
}

editor.addEventListener('selectionchange', handleSelectionChanged);

window.redrawTextArea();
