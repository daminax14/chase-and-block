export class Node {
  constructor(id, x, z, type = 'normal') {
    this.id = id;
    this.x = x;
    this.z = z;
    this.type = type; // normal | exit | portal
    this.linkedTo = null;
  }
}
