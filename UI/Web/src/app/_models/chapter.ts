import { MangaFile } from './manga-file';
import { Person } from './person';
import { Tag } from './tag';

export interface Chapter {
    id: number;
    range: string;
    number: string;
    files: Array<MangaFile>;
    /**
     * This is used in the UI, it is not updated or sent to Backend
     */
    coverImage: string;
    coverImageLocked: boolean;
    pages: number;
    volumeId: number;
    pagesRead: number; // Attached for the given user when requesting from API
    isSpecial: boolean;
    title: string;
    created: string;

    titleName: string;
    /**
     * This is only Year and Month, Day is not supported from underlying sources
     */
    releaseDate: string;
    writers: Array<Person>;
    penciller: Array<Person>;
    inker: Array<Person>;
    colorist: Array<Person>;
    letterer: Array<Person>;
    coverArtist: Array<Person>;
    editor: Array<Person>;
    publisher: Array<Person>;
    tags: Array<Tag>;
}
