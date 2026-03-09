import { Injectable, signal } from '@angular/core';
import { Stone, PRESET_SIZES } from '../models/stone.model';

export interface CutSuggestion {
  sourceSize: string;
  sourceCount: number;
  piecesPerSource: number;
  suggestedToCut: number;
  possiblePieces: number;
}

export interface CuttingAvailabilityResult {
  isValidRequest: boolean;
  requestedSize: string;
  requestedQuantity: number;
  directAvailable: number;
  totalPossible: number;
  canDeliver: boolean;
  shortage: number;
  suggestions: CutSuggestion[];
}

export interface StockMutationResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private stones = signal<Stone[]>([
    {
      id: '1',
      name: 'Black Granite',
      type: 'Granite',
      color: 'Black',
      pricePerUnit: 500,
      stockQuantity: 100,
      sizes: [...PRESET_SIZES],
      lastRestocked: new Date('2024-01-15'),
      supplier: 'XYZ Suppliers',
      description: 'High quality black granite tiles'
    },
    {
      id: '2',
      name: 'Red Granite',
      type: 'Granite',
      color: 'Red',
      pricePerUnit: 550,
      stockQuantity: 80,
      sizes: [...PRESET_SIZES],
      lastRestocked: new Date('2024-01-20'),
      supplier: 'ABC Quarries',
      description: 'Premium red granite with natural finish'
    },
    {
      id: '3',
      name: 'White Marble',
      type: 'Marble',
      color: 'White',
      pricePerUnit: 600,
      stockQuantity: 50,
      sizes: [...PRESET_SIZES],
      lastRestocked: new Date('2024-02-01'),
      supplier: 'XYZ Suppliers',
      description: 'Elegant white marble for premium projects'
    }
  ]);

  stones$ = this.stones.asReadonly();

  addStone(stone: Stone): void {
    const current = this.stones();
    stone.id = (Math.max(...current.map(s => parseInt(s.id)), 0) + 1).toString();
    this.stones.set([...current, stone]);
  }

  updateStone(stone: Stone): void {
    const current = this.stones();
    const index = current.findIndex(s => s.id === stone.id);
    if (index !== -1) {
      const updated = [...current];
      updated[index] = stone;
      this.stones.set(updated);
    }
  }

  deleteStone(stoneId: string): void {
    const current = this.stones();
    this.stones.set(current.filter(s => s.id !== stoneId));
  }

  getStone(stoneId: string): Stone | undefined {
    return this.stones().find(s => s.id === stoneId);
  }

  updateStock(stoneId: string, quantity: number): void {
    const stone = this.getStone(stoneId);
    if (stone) {
      stone.stockQuantity = quantity;
      this.updateStone(stone);
    }
  }

  decreaseStock(stoneId: string, quantity: number): boolean {
    const stone = this.getStone(stoneId);
    if (stone && stone.stockQuantity >= quantity) {
      stone.stockQuantity -= quantity;
      this.updateStone(stone);
      return true;
    }
    return false;
  }

  getAvailableStones(): Stone[] {
    return this.stones().filter(s => s.stockQuantity > 0);
  }

  getLowStockStones(threshold: number = 20): Stone[] {
    return this.stones().filter(s => s.stockQuantity <= threshold && s.stockQuantity > 0);
  }

  getCuttingAvailability(
    stoneId: string,
    requestedSize: string,
    requestedQuantity: number
  ): CuttingAvailabilityResult {
    const normalizedSize = requestedSize.trim();
    const quantity = Math.max(0, requestedQuantity);
    const stone = this.getStone(stoneId);

    if (!stone || !this.isValidDimension(normalizedSize) || quantity <= 0) {
      return {
        isValidRequest: false,
        requestedSize: normalizedSize,
        requestedQuantity: quantity,
        directAvailable: 0,
        totalPossible: 0,
        canDeliver: false,
        shortage: quantity,
        suggestions: []
      };
    }

    const directEntry = stone.sizes.find(
      size => size.dimension.toLowerCase().trim() === normalizedSize.toLowerCase()
    );
    const directAvailable = directEntry?.quantity || 0;

    const allSuggestions: CutSuggestion[] = stone.sizes
      .filter(size => size.dimension.toLowerCase().trim() !== normalizedSize.toLowerCase())
      .filter(size => size.quantity > 0)
      .map(size => {
        const piecesPerSource = this.getPiecesPerSource(size.dimension, normalizedSize);
        return {
          sourceSize: size.dimension,
          sourceCount: size.quantity,
          piecesPerSource,
          suggestedToCut: 0,
          possiblePieces: piecesPerSource * size.quantity
        };
      })
      .filter(suggestion => suggestion.piecesPerSource > 0)
      .sort((a, b) => b.piecesPerSource - a.piecesPerSource);

    const totalPossible =
      directAvailable + allSuggestions.reduce((sum, suggestion) => sum + suggestion.possiblePieces, 0);
    const canDeliver = totalPossible >= quantity;

    let remaining = Math.max(0, quantity - directAvailable);
    const suggestions = allSuggestions.map(suggestion => {
      if (remaining <= 0) {
        return suggestion;
      }

      const maxFromThisSource = suggestion.possiblePieces;
      const piecesNeeded = Math.min(remaining, maxFromThisSource);
      const suggestedToCut = Math.ceil(piecesNeeded / suggestion.piecesPerSource);
      remaining -= Math.min(maxFromThisSource, suggestedToCut * suggestion.piecesPerSource);

      return {
        ...suggestion,
        suggestedToCut
      };
    });

    return {
      isValidRequest: true,
      requestedSize: normalizedSize,
      requestedQuantity: quantity,
      directAvailable,
      totalPossible,
      canDeliver,
      shortage: Math.max(0, quantity - totalPossible),
      suggestions
    };
  }

  addSizeStock(stoneId: string, sizeDimension: string, quantity: number): StockMutationResult {
    const stone = this.getStone(stoneId);
    const normalizedDimension = sizeDimension.trim().toLowerCase();

    if (!stone) {
      return { success: false, message: 'Stone not found.' };
    }

    if (quantity <= 0) {
      return { success: false, message: 'Quantity must be greater than zero.' };
    }

    const updatedStone: Stone = {
      ...stone,
      sizes: stone.sizes.map(size =>
        size.dimension.toLowerCase().trim() === normalizedDimension
          ? { ...size, quantity: size.quantity + quantity }
          : { ...size }
      )
    };

    updatedStone.stockQuantity = this.calculateTotalStock(updatedStone);
    updatedStone.lastRestocked = new Date();
    this.updateStone(updatedStone);

    return { success: true, message: 'Stock added successfully.' };
  }

  consumeStockWithCutting(
    stoneId: string,
    requestedSize: string,
    requestedQuantity: number
  ): StockMutationResult {
    const availability = this.getCuttingAvailability(stoneId, requestedSize, requestedQuantity);
    if (!availability.isValidRequest) {
      return { success: false, message: 'Invalid size or quantity requested.' };
    }

    if (!availability.canDeliver) {
      return {
        success: false,
        message: `Insufficient stock. Shortage: ${availability.shortage}.`
      };
    }

    const stone = this.getStone(stoneId);
    if (!stone) {
      return { success: false, message: 'Stone not found.' };
    }

    const updatedSizes = stone.sizes.map(size => ({ ...size }));
    const targetDimension = requestedSize.trim().toLowerCase();
    const targetSize = updatedSizes.find(
      size => size.dimension.toLowerCase().trim() === targetDimension
    );

    const directAvailable = targetSize?.quantity || 0;
    const directUsed = Math.min(directAvailable, requestedQuantity);
    if (targetSize) {
      targetSize.quantity -= directUsed;
    }

    let remaining = requestedQuantity - directUsed;
    for (const suggestion of availability.suggestions) {
      if (remaining <= 0 || suggestion.suggestedToCut <= 0) {
        continue;
      }

      const sourceSize = updatedSizes.find(
        size => size.dimension.toLowerCase().trim() === suggestion.sourceSize.toLowerCase().trim()
      );
      if (!sourceSize) {
        continue;
      }

      const cutCount = Math.min(sourceSize.quantity, suggestion.suggestedToCut);
      sourceSize.quantity -= cutCount;
      remaining -= cutCount * suggestion.piecesPerSource;
    }

    if (remaining > 0) {
      return { success: false, message: 'Unable to allocate stock for requested cut plan.' };
    }

    const updatedStone: Stone = {
      ...stone,
      sizes: updatedSizes
    };
    updatedStone.stockQuantity = this.calculateTotalStock(updatedStone);
    this.updateStone(updatedStone);

    return { success: true, message: 'Stock consumed successfully.' };
  }

  private calculateTotalStock(stone: Stone): number {
    return stone.sizes.reduce((sum, size) => sum + size.quantity, 0);
  }

  private getPiecesPerSource(sourceSize: string, requestedSize: string): number {
    const source = this.parseSizeToFeet(sourceSize);
    const target = this.parseSizeToFeet(requestedSize);

    if (!source || !target) {
      return 0;
    }

    const normalOrientation =
      Math.floor(source.length / target.length) * Math.floor(source.width / target.width);
    const rotatedOrientation =
      Math.floor(source.length / target.width) * Math.floor(source.width / target.length);

    return Math.max(normalOrientation, rotatedOrientation);
  }

  private parseSizeToFeet(size: string): { length: number; width: number } | null {
    const dimensions = size
      .toLowerCase()
      .split('x')
      .map(value => Number(value.trim()));

    if (dimensions.length !== 2 || dimensions.some(value => Number.isNaN(value) || value <= 0)) {
      return null;
    }

    const [rawLength, rawWidth] = dimensions;
    const isInches = rawLength > 10 || rawWidth > 10;

    return {
      length: isInches ? rawLength / 12 : rawLength,
      width: isInches ? rawWidth / 12 : rawWidth
    };
  }

  private isValidDimension(size: string): boolean {
    return this.parseSizeToFeet(size) !== null;
  }
}
